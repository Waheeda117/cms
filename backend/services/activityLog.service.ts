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
 * Helper function to format currency
 */
private static formatCurrency = (amount: number): string => {
  return `PKR ${amount?.toFixed(2) || '0.00'}`;
};

/**
 * Helper function to format date
 */
private static formatDate = (date: any): string => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
};

  
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
 * Log batch creation - only for finalized batches with batch details
 */
static async logBatchCreated(
  batch: IInventory, 
  owner: mongoose.Types.ObjectId,
  isDraft: boolean = false
): Promise<IActivityLog | null> {
  // Only log if batch is not draft (finalized immediately)
  if (isDraft) {
    return null; // Don't log draft batch creation
  }

  const totalValue = ActivityLogService.formatCurrency(batch.overallPrice || 0);
  const medicinesSummary = batch.medicines.map(med => 
    `${med.medicineName} (${med.quantity} units @ ${this.formatCurrency(med.price)}/unit)`
  ).join(', ');
  const miscAmount = batch.miscellaneousAmount ? `, Miscellaneous: ${this.formatCurrency(batch.miscellaneousAmount)}` : '';
  
  const details = `Batch created and finalized: Batch #${batch.batchNumber}, Bill ID: ${batch.billID || 'N/A'}, Total Value: ${totalValue}${miscAmount}, Medicines: ${medicinesSummary}`;

  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'CREATED',
    details,
    owner
  });
}


/**
 * Log batch creation for draft - creates initial log with batch details
 */
static async logDraftBatchCreated(
  batch: IInventory, 
  owner: mongoose.Types.ObjectId
): Promise<IActivityLog> {
  const totalValue = ActivityLogService.formatCurrency(batch.overallPrice || 0);
  const medicinesSummary = batch.medicines.map(med => 
    `${med.medicineName} (${med.quantity} units @ ${this.formatCurrency(med.price)}/unit)`
  ).join(', ');
  const miscAmount = batch.miscellaneousAmount ? `, Miscellaneous: ${this.formatCurrency(batch.miscellaneousAmount)}` : '';
  
  const details = `Batch created: Batch #${batch.batchNumber}, Bill ID: ${batch.billID || 'N/A'}, Total Value: ${totalValue}${miscAmount}, Medicines: ${medicinesSummary}`;

  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'CREATED',
    details,
    owner
  });
}

/**
 * Log batch finalization - when draft becomes finalized with batch details
 */
static async logBatchFinalized(
  batch: IInventory, 
  owner: mongoose.Types.ObjectId
): Promise<IActivityLog> {
  const totalValue = ActivityLogService.formatCurrency(batch.overallPrice || 0);
  const medicinesSummary = batch.medicines.map(med => 
    `${med.medicineName} (${med.quantity} units @ ${this.formatCurrency(med.price)}/unit)`
  ).join(', ');
  const miscAmount = batch.miscellaneousAmount ? `, Miscellaneous: ${this.formatCurrency(batch.miscellaneousAmount)}` : '';
  
  const details = `Batch finalized: Batch #${batch.batchNumber}, Bill ID: ${batch.billID || 'N/A'}, Total Value: ${totalValue}${miscAmount}, Medicines: ${medicinesSummary}`;

  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'FINALIZED',
    details,
    owner
  });
}



/**
 * Log batch update - only for finalized batches or when finalizing
 */
static async logBatchUpdated(
  batch: IInventory,
  owner: mongoose.Types.ObjectId,
  changes: any,
  oldBatch: IInventory
): Promise<IActivityLog | null> {
  // If old batch was draft and new batch is finalized, log as finalization
  if (oldBatch.isDraft && !batch.isDraft) {
    return this.logBatchFinalized(batch, owner);
  }
  
  // If current batch is still draft, don't log the update
  if (batch.isDraft) {
    return null;
  }

  // Only log updates for finalized batches
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
  const details = `Batch deleted with ${batch.medicines.length} medicines (Total value: $${batch.overallPrice})`;

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
      summaryParts.push(`bill ID updated (${oldBatch.billID || 'none'} → ${changes.billID})`);
    }

    // Check medicines changes - Super detailed tracking
    if (changes.medicines) {
      const medicineChanges = this.detectSuperDetailedMedicineChanges(oldBatch.medicines, changes.medicines);
      
      if (medicineChanges.hasChanges) {
        // Add all medicine changes to the changes list
        changesList.push(...medicineChanges.detailedChanges);
        
        // Add summary parts
        summaryParts.push(...medicineChanges.summaryParts);
      }
    }

    // Check draft note changes
    if (changes.draftNote !== undefined && oldBatch.draftNote !== changes.draftNote) {
      changesList.push({
        field: 'draftNote',
        oldValue: oldBatch.draftNote || 'none',
        newValue: changes.draftNote || 'none'
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
 * Super detailed medicine change detection with simplified output
 */
private static detectSuperDetailedMedicineChanges(oldMedicines: any[], newMedicines: any[]): {
  hasChanges: boolean;
  detailedChanges: any[];
  summaryParts: string[];
} {
  const detailedChanges = [];
  const summaryParts: string[] = [];
  let hasChanges = false;

  // Check if medicines count changed
  if (oldMedicines.length !== newMedicines.length) {
    hasChanges = true;
    detailedChanges.push({
      field: 'medicinesCount',
      oldValue: oldMedicines.length,
      newValue: newMedicines.length
    });
  }

  // Create maps for easier lookup
  const oldMedicinesMap = new Map();
  const newMedicinesMap = new Map();

  oldMedicines.forEach((med, index) => {
    const key = med.medicineId?.toString() || med._id?.toString() || `temp_${index}`;
    oldMedicinesMap.set(key, { ...med, originalIndex: index });
  });

  newMedicines.forEach((med, index) => {
    const key = med.medicineId?.toString() || med._id?.toString() || `temp_${index}`;
    newMedicinesMap.set(key, { ...med, originalIndex: index });
  });

  // Track medicine additions - simplified
  newMedicinesMap.forEach((newMed, key) => {
    if (!oldMedicinesMap.has(key)) {
      hasChanges = true;
      
      detailedChanges.push({
        field: 'medicineAdded',
        oldValue: null,
        newValue: {
          medicineId: newMed.medicineId,
          medicineName: newMed.medicineName,
          quantity: newMed.quantity,
          price: newMed.price,
          expiryDate: newMed.expiryDate
        }
      });

      summaryParts.push(`Medicine "${newMed.medicineName}" added: Quantity: ${newMed.quantity} units, Price: ${this.formatCurrency(newMed.price)}, Expiry: ${this.formatDate(newMed.expiryDate)}`);
    }
  });

  // Track medicine removals - simplified
  oldMedicinesMap.forEach((oldMed, key) => {
    if (!newMedicinesMap.has(key)) {
      hasChanges = true;
      
      detailedChanges.push({
        field: 'medicineRemoved',
        oldValue: {
          medicineId: oldMed.medicineId,
          medicineName: oldMed.medicineName,
          quantity: oldMed.quantity,
          price: oldMed.price,
          expiryDate: oldMed.expiryDate
        },
        newValue: null
      });

      summaryParts.push(`Medicine "${oldMed.medicineName}" removed`);
    }
  });

  // Track changes in existing medicines - simplified with specific labels
  newMedicinesMap.forEach((newMed, key) => {
    const oldMed = oldMedicinesMap.get(key);
    
    if (oldMed) {
      const medicineChanges = [];
      const changeDetails = [];
      
      // Check quantity changes
      if (oldMed.quantity !== newMed.quantity) {
        medicineChanges.push({
          field: `medicine_${newMed.medicineName}_quantity`,
          oldValue: oldMed.quantity,
          newValue: newMed.quantity
        });
        changeDetails.push(`Quantity: ${oldMed.quantity} → ${newMed.quantity} units`);
      }

      // Check price changes
      if (oldMed.price !== newMed.price) {
        medicineChanges.push({
          field: `medicine_${newMed.medicineName}_price`,
          oldValue: oldMed.price,
          newValue: newMed.price
        });
        changeDetails.push(`Price: ${this.formatCurrency(oldMed.price)} → ${this.formatCurrency(newMed.price)}`);
      }

      // Check expiry date changes
      const oldExpiryDate = oldMed.expiryDate ? new Date(oldMed.expiryDate) : null;
      const newExpiryDate = newMed.expiryDate ? new Date(newMed.expiryDate) : null;
      const expiryChanged = oldExpiryDate?.getTime() !== newExpiryDate?.getTime();
      
      if (expiryChanged) {
        medicineChanges.push({
          field: `medicine_${newMed.medicineName}_expiry`,
          oldValue: this.formatDate(oldExpiryDate),
          newValue: this.formatDate(newExpiryDate)
        });
        changeDetails.push(`Expiry Date: ${this.formatDate(oldExpiryDate)} → ${this.formatDate(newExpiryDate)}`);
      }

      // Check medicine name changes
      if (oldMed.medicineName !== newMed.medicineName) {
        medicineChanges.push({
          field: `medicine_name_change`,
          oldValue: oldMed.medicineName,
          newValue: newMed.medicineName
        });
        changeDetails.push(`Medicine Name: "${oldMed.medicineName}" → "${newMed.medicineName}"`);
      }

      if (medicineChanges.length > 0) {
        hasChanges = true;
        detailedChanges.push(...medicineChanges);
        
        // Create simplified summary showing only what changed
        const medicineSummary = `Medicine "${newMed.medicineName}" updated: ${changeDetails.join(', ')}`;
        summaryParts.push(medicineSummary);
      }
    }
  });

  return { hasChanges, detailedChanges, summaryParts };
}

  /**
   * Compare medicines arrays to detect changes - Simplified version for backward compatibility
   */
  private static compareMedicines(oldMedicines: any[], newMedicines: any[]): boolean {
    if (oldMedicines.length !== newMedicines.length) return true;

    for (let i = 0; i < oldMedicines.length; i++) {
      const oldMed = oldMedicines[i];
      const newMed = newMedicines[i];

      if (oldMed.medicineId !== newMed.medicineId ||
          oldMed.quantity !== newMed.quantity ||
          oldMed.price !== newMed.price ||
          oldMed.medicineName !== newMed.medicineName ||
          oldMed.expiryDate !== newMed.expiryDate) {
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