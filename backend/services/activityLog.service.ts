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
 * Log batch creation - only for finalized batches
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

  const details = `Batch created and finalized with ${batch.medicines.length} medicines`;

  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'CREATED',
    details,
    owner
  });
}

/**
 * Log batch creation for draft - creates initial log
 */
static async logDraftBatchCreated(
  batch: IInventory, 
  owner: mongoose.Types.ObjectId
): Promise<IActivityLog> {
  const details = `Batch created with ${batch.medicines.length} medicines`;

  return this.logActivity({
    batchId: batch._id as mongoose.Types.ObjectId,
    batchNumber: batch.batchNumber,
    action: 'CREATED',
    details,
    owner
  });
}

/**
 * Log batch finalization - when draft becomes finalized
 */
static async logBatchFinalized(
  batch: IInventory, 
  owner: mongoose.Types.ObjectId
): Promise<IActivityLog> {
  const details = `Batch finalized with ${batch.medicines.length} medicines`;

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
 * Super detailed medicine change detection with relevant information only
 */
private static detectSuperDetailedMedicineChanges(oldMedicines: any[], newMedicines: any[]): {
  hasChanges: boolean;
  detailedChanges: any[];
  summaryParts: string[];
} {
  const detailedChanges = [];
  const summaryParts = [];
  let hasChanges = false;

  // Helper function to format date
  const formatDate = (date: any): string => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return `PKR ${amount?.toFixed(2) || '0.00'}`;
  };

  // Check if medicines count changed
  if (oldMedicines.length !== newMedicines.length) {
    hasChanges = true;
    detailedChanges.push({
      field: 'medicinesCount',
      oldValue: oldMedicines.length,
      newValue: newMedicines.length
    });
    summaryParts.push(`Total medicines count changed from ${oldMedicines.length} to ${newMedicines.length}`);
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

  // Track medicine additions with complete details
  const addedMedicines = [];
  newMedicinesMap.forEach((newMed, key) => {
    if (!oldMedicinesMap.has(key)) {
      addedMedicines.push(newMed);
      hasChanges = true;
      
      const medicineDetails = {
        medicineId: newMed.medicineId,
        medicineName: newMed.medicineName,
        quantity: newMed.quantity,
        price: newMed.price,
        expiryDate: newMed.expiryDate,
        totalValue: (newMed.quantity * newMed.price)
      };

      detailedChanges.push({
        field: 'medicineAdded',
        oldValue: null,
        newValue: medicineDetails
      });

      // Create detailed summary for added medicine
      const addedSummary = `Medicine "${newMed.medicineName}" added with complete details: ` +
        `Quantity: ${newMed.quantity} units, ` +
        `Unit Price: ${formatCurrency(newMed.price)}, ` +
        `Total Value: ${formatCurrency(newMed.quantity * newMed.price)}, ` +
        `Expiry Date: ${formatDate(newMed.expiryDate)}`;
      
      summaryParts.push(addedSummary);
    }
  });

  // Track medicine removals with complete details
  const removedMedicines = [];
  oldMedicinesMap.forEach((oldMed, key) => {
    if (!newMedicinesMap.has(key)) {
      removedMedicines.push(oldMed);
      hasChanges = true;
      
      const medicineDetails = {
        medicineId: oldMed.medicineId,
        medicineName: oldMed.medicineName,
        quantity: oldMed.quantity,
        price: oldMed.price,
        expiryDate: oldMed.expiryDate,
        totalValue: (oldMed.quantity * oldMed.price)
      };

      detailedChanges.push({
        field: 'medicineRemoved',
        oldValue: medicineDetails,
        newValue: null
      });

      // Create detailed summary for removed medicine
      const removedSummary = `Medicine "${oldMed.medicineName}" removed with complete details: ` +
        `Lost Quantity: ${oldMed.quantity} units, ` +
        `Unit Price: ${formatCurrency(oldMed.price)}, ` +
        `Lost Value: ${formatCurrency(oldMed.quantity * oldMed.price)}, ` +
        `Expiry Date: ${formatDate(oldMed.expiryDate)}`;
      
      summaryParts.push(removedSummary);
    }
  });

  // Track changes in existing medicines with specific field-only details
  newMedicinesMap.forEach((newMed, key) => {
    const oldMed = oldMedicinesMap.get(key);
    
    if (oldMed) {
      const medicineChanges = [];
      const changeDetails = [];
      
      // Track what fields actually changed
      const changedFields = {
        quantity: oldMed.quantity !== newMed.quantity,
        price: oldMed.price !== newMed.price,
        expiryDate: false,
        medicineName: oldMed.medicineName !== newMed.medicineName
      };

      // Check expiry date changes
      const oldExpiryDate = oldMed.expiryDate ? new Date(oldMed.expiryDate) : null;
      const newExpiryDate = newMed.expiryDate ? new Date(newMed.expiryDate) : null;
      changedFields.expiryDate = oldExpiryDate?.getTime() !== newExpiryDate?.getTime();

      // Only log quantity changes if quantity actually changed
      if (changedFields.quantity) {
        const quantityDifference = newMed.quantity - oldMed.quantity;
        
        // If only quantity changed, provide quantity + value impact details
        if (changedFields.quantity && !changedFields.price && !changedFields.expiryDate && !changedFields.medicineName) {
          const oldTotalValue = oldMed.quantity * oldMed.price;
          const newTotalValue = newMed.quantity * newMed.price;
          const valueDifference = newTotalValue - oldTotalValue;

          medicineChanges.push({
            field: `medicine_${newMed.medicineName}_quantity_change`,
            oldValue: {
              quantity: oldMed.quantity,
              unitPrice: oldMed.price,
              totalValue: oldTotalValue
            },
            newValue: {
              quantity: newMed.quantity,
              unitPrice: newMed.price,
              totalValue: newTotalValue,
              quantityDifference: quantityDifference,
              valueDifference: valueDifference
            }
          });

          changeDetails.push(`Quantity: ${oldMed.quantity} → ${newMed.quantity} units (${quantityDifference > 0 ? '+' : ''}${quantityDifference} units), Value impact: ${formatCurrency(Math.abs(valueDifference))} ${valueDifference > 0 ? 'increase' : 'decrease'}`);
        } else {
          // If quantity changed along with other fields, just show quantity change
          medicineChanges.push({
            field: `medicine_${newMed.medicineName}_quantity`,
            oldValue: oldMed.quantity,
            newValue: newMed.quantity
          });
          changeDetails.push(`Quantity: ${oldMed.quantity} → ${newMed.quantity} units (${quantityDifference > 0 ? '+' : ''}${quantityDifference} units)`);
        }
      }

      // Only log price changes if price actually changed
      if (changedFields.price) {
        const priceDifference = newMed.price - oldMed.price;
        
        // If only price changed, provide price + value impact details
        if (changedFields.price && !changedFields.quantity && !changedFields.expiryDate && !changedFields.medicineName) {
          const oldTotalValue = oldMed.quantity * oldMed.price;
          const newTotalValue = newMed.quantity * newMed.price;
          const valueDifference = newTotalValue - oldTotalValue;

          medicineChanges.push({
            field: `medicine_${newMed.medicineName}_price_change`,
            oldValue: {
              unitPrice: oldMed.price,
              quantity: oldMed.quantity,
              totalValue: oldTotalValue
            },
            newValue: {
              unitPrice: newMed.price,
              quantity: newMed.quantity,
              totalValue: newTotalValue,
              priceDifference: priceDifference,
              valueDifference: valueDifference
            }
          });

          const percentageChange = ((priceDifference / oldMed.price) * 100).toFixed(2);
          changeDetails.push(`Unit Price: ${formatCurrency(oldMed.price)} → ${formatCurrency(newMed.price)} (${priceDifference > 0 ? '+' : ''}${formatCurrency(Math.abs(priceDifference))}, ${percentageChange}% ${priceDifference > 0 ? 'increase' : 'decrease'}), Total value impact: ${formatCurrency(Math.abs(valueDifference))} ${valueDifference > 0 ? 'increase' : 'decrease'}`);
        } else {
          // If price changed along with other fields, just show price change
          medicineChanges.push({
            field: `medicine_${newMed.medicineName}_price`,
            oldValue: oldMed.price,
            newValue: newMed.price
          });
          
          const percentageChange = ((priceDifference / oldMed.price) * 100).toFixed(2);
          changeDetails.push(`Unit Price: ${formatCurrency(oldMed.price)} → ${formatCurrency(newMed.price)} (${priceDifference > 0 ? '+' : ''}${formatCurrency(Math.abs(priceDifference))}, ${percentageChange}% ${priceDifference > 0 ? 'increase' : 'decrease'})`);
        }
      }

      // Only log expiry date changes if expiry date actually changed
      if (changedFields.expiryDate) {
        // Calculate days difference
        let daysDifference = 0;
        if (oldExpiryDate && newExpiryDate) {
          daysDifference = Math.ceil((newExpiryDate.getTime() - oldExpiryDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        medicineChanges.push({
          field: `medicine_${newMed.medicineName}_expiry_change`,
          oldValue: {
            expiryDate: formatDate(oldExpiryDate)
          },
          newValue: {
            expiryDate: formatDate(newExpiryDate),
            daysDifference: daysDifference
          }
        });

        const daysText = daysDifference > 0 ? `${daysDifference} days extended` : daysDifference < 0 ? `${Math.abs(daysDifference)} days shortened` : 'same period';
        changeDetails.push(`Expiry Date: ${formatDate(oldExpiryDate)} → ${formatDate(newExpiryDate)} (${daysText})`);
      }

      // Only log medicine name changes if name actually changed
      if (changedFields.medicineName) {
        medicineChanges.push({
          field: `medicine_name_change`,
          oldValue: {
            medicineName: oldMed.medicineName
          },
          newValue: {
            medicineName: newMed.medicineName
          }
        });

        changeDetails.push(`Medicine Name: "${oldMed.medicineName}" → "${newMed.medicineName}"`);
      }

      if (medicineChanges.length > 0) {
        hasChanges = true;
        detailedChanges.push(...medicineChanges);
        
        // Create summary showing only what changed
        const medicineSummary = `Medicine "${newMed.medicineName}" updated with complete details: ${changeDetails.join(', ')}`;
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