import { ActivityLog, IActivityLog } from "../models/activityLog.model.js";
import { IInventory } from "../models/inventory.model.js";
import mongoose from "mongoose";

export interface LogActivityParams {
  batchId: mongoose.Types.ObjectId;
  batchNumber: string;
  action: 'CREATED' | 'FINALIZED' | 'UPDATED' | 'DELETED';
  details: string;
  owner: mongoose.Types.ObjectId;
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
}

export class ActivityLogService {
  
  /**
   * Log a batch activity
   */
  static async logActivity(params: LogActivityParams): Promise<IActivityLog> {
    const log = new ActivityLog({
      batchId: params.batchId,
      batchNumber: params.batchNumber,
      action: params.action,
      details: params.details,
      owner: params.owner,
      timestamp: new Date(),
      changes: params.changes || []
    });

    return await log.save();
  }

  /**
   * Log batch creation
   */
    static async logBatchCreated(
    batch: IInventory, 
    owner: mongoose.Types.ObjectId,
    isDraft: boolean = false
    ): Promise<IActivityLog> {
    const details = isDraft 
        ? `Draft batch created with ${batch.medicines.length} medicines` 
        : `Batch created and finalized with ${batch.medicines.length} medicines`;

    return this.logActivity({
        batchId: batch._id as mongoose.Types.ObjectId,
        batchNumber: batch.batchNumber,
        action: 'CREATED',
        details,
        owner
    });
    }

  /**
   * Log batch finalization
   */
static async logBatchFinalized(
  batch: IInventory, 
  owner: mongoose.Types.ObjectId
): Promise<IActivityLog> {
  const details = `Draft batch finalized with ${batch.medicines.length} medicines`;

  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'FINALIZED',
    details,
    owner
  });
}

  /**
   * Log batch update with detailed changes
   */
static async logBatchUpdated(
  batch: IInventory,
  owner: mongoose.Types.ObjectId,
  changes: any,
  oldBatch: IInventory
): Promise<IActivityLog> {
  const changeDetails = this.generateUpdateDetails(changes, oldBatch, batch);
  
  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'UPDATED',
    details: changeDetails.summary,
    owner,
    changes: changeDetails.changes
  });
}
  /**
   * Log batch deletion
   */
    static async logBatchDeleted(
    batch: IInventory,
    owner: mongoose.Types.ObjectId
    ): Promise<IActivityLog> {
    const details = `Batch deleted with ${batch.medicines.length} medicines (Total value: PKR ${batch.overallPrice})`;

    return this.logActivity({
        batchId: batch._id as mongoose.Types.ObjectId,
        batchNumber: batch.batchNumber,
        action: 'DELETED',
        details,
        owner
    });
    }

  /**
   * Generate detailed update information
   */
  private static generateUpdateDetails(
    changes: any, 
    oldBatch: IInventory, 
    newBatch: IInventory
  ): { summary: string; changes: any[] } {
    const changesList = [];
    const summaryParts = [];

    // Check miscellaneous amount changes
    if (changes.miscellaneousAmount !== undefined && 
        oldBatch.miscellaneousAmount !== changes.miscellaneousAmount) {
      changesList.push({
        field: 'miscellaneousAmount',
        oldValue: oldBatch.miscellaneousAmount,
        newValue: changes.miscellaneousAmount
      });
      summaryParts.push(`miscellaneous amount updated (PKR ${oldBatch.miscellaneousAmount} → PKR ${changes.miscellaneousAmount})`);
    }

    // Check overall price changes
    if (changes.overallPrice !== undefined && 
        oldBatch.overallPrice !== changes.overallPrice) {
      changesList.push({
        field: 'overallPrice',
        oldValue: oldBatch.overallPrice,
        newValue: changes.overallPrice
      });
      summaryParts.push(`overall price updated (PKR ${oldBatch.overallPrice} → PKR ${changes.overallPrice})`);
    }

    // Check batch number changes
    if (changes.batchNumber && oldBatch.batchNumber !== changes.batchNumber) {
      changesList.push({
        field: 'batchNumber',
        oldValue: oldBatch.batchNumber,
        newValue: changes.batchNumber
      });
      summaryParts.push(`batch number updated (${oldBatch.batchNumber} → ${changes.batchNumber})`);
    }

    // Check bill ID changes
    if (changes.billID && oldBatch.billID !== changes.billID) {
      changesList.push({
        field: 'billID',
        oldValue: oldBatch.billID,
        newValue: changes.billID
      });
      summaryParts.push(`bill ID updated`);
    }

    // Check medicines changes
    if (changes.medicines) {
      const oldMedicinesCount = oldBatch.medicines.length;
      const newMedicinesCount = changes.medicines.length;
      
      if (oldMedicinesCount !== newMedicinesCount) {
        changesList.push({
          field: 'medicinesCount',
          oldValue: oldMedicinesCount,
          newValue: newMedicinesCount
        });
        summaryParts.push(`medicines count updated (${oldMedicinesCount} → ${newMedicinesCount})`);
      } else {
        // Check for medicine details changes
        const hasChanges = this.compareMedicines(oldBatch.medicines, changes.medicines);
        if (hasChanges) {
          summaryParts.push(`medicine details updated`);
        }
      }
    }

    // Check draft note changes
    if (changes.draftNote !== undefined && oldBatch.draftNote !== changes.draftNote) {
      changesList.push({
        field: 'draftNote',
        oldValue: oldBatch.draftNote,
        newValue: changes.draftNote
      });
      summaryParts.push(`draft note updated`);
    }

    // Check attachments changes
    if (changes.attachments) {
      const oldCount = oldBatch.attachments?.length || 0;
      const newCount = changes.attachments.length;
      if (oldCount !== newCount) {
        changesList.push({
          field: 'attachments',
          oldValue: oldCount,
          newValue: newCount
        });
        summaryParts.push(`attachments updated (${oldCount} → ${newCount} files)`);
      }
    }

    const summary = summaryParts.length > 0 
      ? `Batch updated: ${summaryParts.join(', ')}`
      : 'Batch updated';

    return { summary, changes: changesList };
  }

  /**
   * Compare medicines arrays to detect changes
   */
  private static compareMedicines(oldMedicines: any[], newMedicines: any[]): boolean {
    if (oldMedicines.length !== newMedicines.length) return true;

    for (let i = 0; i < oldMedicines.length; i++) {
      const oldMed = oldMedicines[i];
      const newMed = newMedicines[i];

      if (oldMed.medicineId !== newMed.medicineId ||
          oldMed.quantity !== newMed.quantity ||
          oldMed.price !== newMed.price ||
          oldMed.medicineName !== newMed.medicineName) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get activity logs for a specific batch
   */
  static async getBatchActivityLogs(
    batchId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      ActivityLog.find({ batchId })
        .populate('owner', 'name email username')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ batchId })
    ]);

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get activity logs by batch number
   */
  static async getBatchActivityLogsByNumber(
    batchNumber: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      ActivityLog.find({ batchNumber })
        .populate('owner', 'name email username')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ batchNumber })
    ]);

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }
}