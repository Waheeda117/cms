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
   * Helper function to format currency - simplified to remove PKR duplication
   */
  private static formatCurrency = (amount: number): string => {
    return `${amount?.toFixed(2) || '0.00'}`;
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
   * Log multiple activities at once
   */
  static async logMultipleActivities(activitiesParams: LogActivityParams[]): Promise<IActivityLog[]> {
    const logs = activitiesParams.map(params => new ActivityLog({
      batchId: params.batchId,
      batchNumber: params.batchNumber,
      action: params.action,
      details: params.details,
      owner: params.owner,
      timestamp: new Date(),
      changes: params.changes || []
    }));

    return await ActivityLog.insertMany(logs);
  }

  /**
   * Log batch creation - only for finalized batches with shortened details
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

    const totalAmount = `PKR ${this.formatCurrency(batch.overallPrice || 0)}`;
    const medicineCount = batch.medicines.length;
    const miscAmount = batch.miscellaneousAmount ? `PKR ${this.formatCurrency(batch.miscellaneousAmount)}` : 'PKR 0.00';
    
    const details = `Batch created and finalized: Batch ${batch.batchNumber}, Cheque Number: ${batch.billID || 'N/A'}, Total Amount: ${totalAmount}, Miscellaneous amount: ${miscAmount}, Medicines: ${medicineCount} items`;

    return this.logActivity({
      batchId: batch._id as mongoose.Types.ObjectId,
      batchNumber: batch.batchNumber,
      action: 'CREATED',
      details,
      owner
    });
  }

  /**
   * Log batch creation for draft - creates initial log with shortened details
   */
  static async logDraftBatchCreated(
    batch: IInventory, 
    owner: mongoose.Types.ObjectId
  ): Promise<IActivityLog> {
    const totalAmount = `PKR ${this.formatCurrency(batch.overallPrice || 0)}`;
    const medicineCount = batch.medicines.length;
    const miscAmount = batch.miscellaneousAmount ? `PKR ${this.formatCurrency(batch.miscellaneousAmount)}` : 'PKR 0.00';
    
    const details = `Batch created: Batch ${batch.batchNumber}, Cheque Number: ${batch.billID || 'N/A'}, Total Amount: ${totalAmount}, Miscellaneous amount: ${miscAmount}, Medicines: ${medicineCount} items`;

    return this.logActivity({
      batchId: batch._id as mongoose.Types.ObjectId,
      batchNumber: batch.batchNumber,
      action: 'CREATED',
      details,
      owner
    });
  }

  /**
   * Log batch finalization - when draft becomes finalized with shortened details
   */
  static async logBatchFinalized(
    batch: IInventory, 
    owner: mongoose.Types.ObjectId
  ): Promise<IActivityLog> {
    const totalAmount = `PKR ${this.formatCurrency(batch.overallPrice || 0)}`;
    const medicineCount = batch.medicines.length;
    const miscAmount = batch.miscellaneousAmount ? `PKR ${this.formatCurrency(batch.miscellaneousAmount)}` : 'PKR 0.00';
    
    const details = `Batch finalized: Batch ${batch.batchNumber}, Cheque Number: ${batch.billID || 'N/A'}, Total Amount: ${totalAmount}, Miscellaneous amount: ${miscAmount}, Medicines: ${medicineCount} items`;

    return this.logActivity({
      batchId: batch._id as mongoose.Types.ObjectId,
      batchNumber: batch.batchNumber,
      action: 'FINALIZED',
      details,
      owner
    });
  }

  /**
   * Log batch update - creates separate logs for each type of change
   */
  static async logBatchUpdated(
    batch: IInventory,
    owner: mongoose.Types.ObjectId,
    changes: any,
    oldBatch: IInventory
  ): Promise<IActivityLog[] | null> {
    // If old batch was draft and new batch is finalized, log as finalization
    if (oldBatch.isDraft && !batch.isDraft) {
      const finalizedLog = await this.logBatchFinalized(batch, owner);
      return [finalizedLog];
    }
    
    // If current batch is still draft, don't log the update
    if (batch.isDraft) {
      return null;
    }

    // Generate separate logs for each type of change
    const separateLogs = this.generateSeparateUpdateLogs(changes, oldBatch, batch, owner);

    // Don't create logs if no actual changes were made
    if (separateLogs.length === 0) {
      return null;
    }
    
    // Create multiple logs
    return await this.logMultipleActivities(separateLogs);
  }

  /**
   * Log batch deletion
   */
  static async logBatchDeleted(
    batch: IInventory,
    owner: mongoose.Types.ObjectId
  ): Promise<IActivityLog> {
    const details = `Batch deleted with ${batch.medicines.length} medicines (Total value: PKR ${this.formatCurrency(batch.overallPrice || 0)})`;

    return this.logActivity({
      batchId: batch._id as mongoose.Types.ObjectId,
      batchNumber: batch.batchNumber,
      action: 'DELETED',
      details,
      owner
    });
  }

  /**
   * Generate separate logs for different types of updates
   */
  private static generateSeparateUpdateLogs(
    changes: any, 
    oldBatch: IInventory, 
    newBatch: IInventory,
    owner: mongoose.Types.ObjectId
  ): LogActivityParams[] {
    const logs: LogActivityParams[] = [];

    // 1. Log miscellaneous amount changes separately
    if (changes.miscellaneousAmount !== undefined && 
        oldBatch.miscellaneousAmount !== changes.miscellaneousAmount) {
      logs.push({
        batchId: newBatch._id as mongoose.Types.ObjectId,
        batchNumber: newBatch.batchNumber,
        action: 'UPDATED',
        details: `Batch updated: miscellaneous amount (PKR ${this.formatCurrency(oldBatch.miscellaneousAmount || 0)} → ${this.formatCurrency(changes.miscellaneousAmount)})`,
        owner,
        changes: [{
          field: 'miscellaneousAmount',
          oldValue: oldBatch.miscellaneousAmount,
          newValue: changes.miscellaneousAmount
        }]
      });
    }

    // 2. Log total amount changes separately (if overall price changed)
    if (changes.overallPrice !== undefined && 
        oldBatch.overallPrice !== changes.overallPrice) {
      logs.push({
        batchId: newBatch._id as mongoose.Types.ObjectId,
        batchNumber: newBatch.batchNumber,
        action: 'UPDATED',
        details: `Batch updated: Total amount (PKR ${this.formatCurrency(oldBatch.overallPrice || 0)} → ${this.formatCurrency(changes.overallPrice)})`,
        owner,
        changes: [{
          field: 'overallPrice',
          oldValue: oldBatch.overallPrice,
          newValue: changes.overallPrice
        }]
      });
    }

    // 3. Log batch number changes separately
    if (changes.batchNumber && oldBatch.batchNumber !== changes.batchNumber) {
      logs.push({
        batchId: newBatch._id as mongoose.Types.ObjectId,
        batchNumber: newBatch.batchNumber,
        action: 'UPDATED',
        details: `Batch updated: batch number (${oldBatch.batchNumber} → ${changes.batchNumber})`,
        owner,
        changes: [{
          field: 'batchNumber',
          oldValue: oldBatch.batchNumber,
          newValue: changes.batchNumber
        }]
      });
    }

    // 4. Log bill ID changes separately
    if (changes.billID && oldBatch.billID !== changes.billID) {
      logs.push({
        batchId: newBatch._id as mongoose.Types.ObjectId,
        batchNumber: newBatch.batchNumber,
        action: 'UPDATED',
        details: `Batch updated: cheque number (${oldBatch.billID || 'none'} → ${changes.billID})`,
        owner,
        changes: [{
          field: 'billID',
          oldValue: oldBatch.billID,
          newValue: changes.billID
        }]
      });
    }

    // 5. Log medicine changes separately - one log per medicine
    if (changes.medicines) {
      const medicineChangeLogs = this.generateSeparateMedicineLogs(
        oldBatch.medicines, 
        changes.medicines, 
        newBatch, 
        owner
      );
      logs.push(...medicineChangeLogs);
    }

    // 6. Log draft note changes separately
    if (changes.draftNote !== undefined && oldBatch.draftNote !== changes.draftNote) {
      logs.push({
        batchId: newBatch._id as mongoose.Types.ObjectId,
        batchNumber: newBatch.batchNumber,
        action: 'UPDATED',
        details: `Batch updated: draft note updated`,
        owner,
        changes: [{
          field: 'draftNote',
          oldValue: oldBatch.draftNote || 'none',
          newValue: changes.draftNote || 'none'
        }]
      });
    }

    // 7. Log attachments changes separately
    if (changes.attachments) {
      const oldCount = oldBatch.attachments?.length || 0;
      const newCount = changes.attachments.length;
      if (oldCount !== newCount) {
        logs.push({
          batchId: newBatch._id as mongoose.Types.ObjectId,
          batchNumber: newBatch.batchNumber,
          action: 'UPDATED',
          details: `Batch updated: attachments (${oldCount} → ${newCount} files)`,
          owner,
          changes: [{
            field: 'attachments',
            oldValue: oldCount,
            newValue: newCount
          }]
        });
      }
    }

    return logs;
  }

  /**
   * Generate separate logs for medicine changes - one log per medicine
   */
  private static generateSeparateMedicineLogs(
    oldMedicines: any[], 
    newMedicines: any[], 
    batch: IInventory,
    owner: mongoose.Types.ObjectId
  ): LogActivityParams[] {
    const logs: LogActivityParams[] = [];

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

    // 1. Log medicine additions - one log per medicine
    newMedicinesMap.forEach((newMed, key) => {
      if (!oldMedicinesMap.has(key)) {
        const totalAmount = (newMed.quantity || 0) * (newMed.price || 0);
        
        logs.push({
          batchId: batch._id as mongoose.Types.ObjectId,
          batchNumber: batch.batchNumber,
          action: 'UPDATED',
          details: `Batch updated: Medicine "${newMed.medicineName}" added: Quantity: ${newMed.quantity} units, Price: PKR ${this.formatCurrency(newMed.price)}, Expiry: ${this.formatDate(newMed.expiryDate)}, Total amount: PKR ${this.formatCurrency(totalAmount)}`,
          owner,
          changes: [{
            field: 'medicineAdded',
            oldValue: null,
            newValue: {
              medicineId: newMed.medicineId,
              medicineName: newMed.medicineName,
              quantity: newMed.quantity,
              price: newMed.price,
              expiryDate: newMed.expiryDate,
              totalAmount: totalAmount
            }
          }]
        });
      }
    });

    // 2. Log medicine removals - one log per medicine
    oldMedicinesMap.forEach((oldMed, key) => {
      if (!newMedicinesMap.has(key)) {
        const totalAmount = (oldMed.quantity || 0) * (oldMed.price || 0);
        
        logs.push({
          batchId: batch._id as mongoose.Types.ObjectId,
          batchNumber: batch.batchNumber,
          action: 'UPDATED',
          details: `Batch updated: Medicine "${oldMed.medicineName}" removed: Quantity: ${oldMed.quantity} units, Price: PKR ${this.formatCurrency(oldMed.price)}, Expiry: ${this.formatDate(oldMed.expiryDate)}, Total amount: PKR ${this.formatCurrency(totalAmount)}`,
          owner,
          changes: [{
            field: 'medicineRemoved',
            oldValue: {
              medicineId: oldMed.medicineId,
              medicineName: oldMed.medicineName,
              quantity: oldMed.quantity,
              price: oldMed.price,
              expiryDate: oldMed.expiryDate,
              totalAmount: totalAmount
            },
            newValue: null
          }]
        });
      }
    });

    // 3. Log changes in existing medicines - one log per medicine with changes
    newMedicinesMap.forEach((newMed, key) => {
      const oldMed = oldMedicinesMap.get(key);
      
      if (oldMed) {
        const medicineChanges = [];
        const changeDetails = [];
        
        // Calculate total amounts for this medicine
        const oldTotal = (oldMed.quantity || 0) * (oldMed.price || 0);
        const newTotal = (newMed.quantity || 0) * (newMed.price || 0);
        
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
          changeDetails.push(`Price: PKR ${this.formatCurrency(oldMed.price)} → ${this.formatCurrency(newMed.price)}`);
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

        // Add total amount change if price or quantity changed
        if (oldTotal !== newTotal && (oldMed.quantity !== newMed.quantity || oldMed.price !== newMed.price)) {
          medicineChanges.push({
            field: `medicine_${newMed.medicineName}_total`,
            oldValue: oldTotal,
            newValue: newTotal
          });
          changeDetails.push(`Total amount: PKR ${this.formatCurrency(oldTotal)} → ${this.formatCurrency(newTotal)}`);
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

        // Create one log per medicine if there are changes
        if (medicineChanges.length > 0) {
          logs.push({
            batchId: batch._id as mongoose.Types.ObjectId,
            batchNumber: batch.batchNumber,
            action: 'UPDATED',
            details: `Batch updated: Medicine "${newMed.medicineName}": ${changeDetails.join(', ')}`,
            owner,
            changes: medicineChanges
          });
        }
      }
    });

    return logs;
  }

  /**
   * Legacy function for backward compatibility - now returns first log only
   */
  private static generateUpdateDetails(
    changes: any, 
    oldBatch: IInventory, 
    newBatch: IInventory
  ): { summary: string; changes: any[] } {
    // This is kept for backward compatibility but now generates separate logs
    const separateLogs = this.generateSeparateUpdateLogs(changes, oldBatch, newBatch, new mongoose.Types.ObjectId());
    
    if (separateLogs.length > 0 && separateLogs[0]) {
      return {
        summary: separateLogs[0].details,
        changes: separateLogs[0].changes || []
      };
    }

    return { summary: 'Batch updated', changes: [] };
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