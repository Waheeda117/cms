import { Request, Response } from "express";
import { Inventory, DiscardRecord, IDiscardRecord } from "../models/inventory.model.js";
import { AuthenticatedRequest } from "../types/index.js";
import mongoose from "mongoose";
import { PipelineStage } from 'mongoose';

// 1. Get all already expired medicines with batch details
export const getAllExpiredMedicines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            sortBy = "medicineName",
            sortOrder = "asc"
        } = req.query;

        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const pipeline: PipelineStage[] = [
            // Only include finalized batches
            { $match: { isDraft: false } },
            // Unwind medicines array
            { $unwind: "$medicines" },
            // Match only expired medicines (before today)
            {
                $match: {
                    "medicines.expiryDate": { $lt: today },
                    "medicines.quantity": { $gt: 0 } // Only include medicines with quantity > 0
                }
            }
        ];

        // Add search filter if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "medicines.medicineName": { $regex: search, $options: "i" } },
                        { batchNumber: { $regex: search, $options: "i" } },
                        { billID: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Group by medicine to combine all batches for each medicine
        pipeline.push({
            $group: {
                _id: {
                    medicineId: "$medicines.medicineId",
                    medicineName: "$medicines.medicineName"
                },
                batches: {
                    $push: {
                        batchId: "$_id",
                        batchNumber: "$batchNumber",
                        billID: "$billID",
                        quantity: "$medicines.quantity",
                        price: "$medicines.price",
                        totalAmount: "$medicines.totalAmount",
                        expiryDate: "$medicines.expiryDate",
                        dateOfPurchase: "$medicines.dateOfPurchase",
                        reorderLevel: "$medicines.reorderLevel",
                        createdAt: "$createdAt",
                        daysExpired: {
                            $ceil: {
                                $divide: [
                                    { $subtract: [today, "$medicines.expiryDate"] },
                                    86400000 // milliseconds in a day
                                ]
                            }
                        }
                    }
                },
                totalQuantity: { $sum: "$medicines.quantity" },
                totalValue: { $sum: "$medicines.totalAmount" },
                totalBatches: { $sum: 1 },
                // Get the earliest expiry date for sorting
                earliestExpiryDate: { $min: "$medicines.expiryDate" },
                // Get the average price
                averagePrice: { $avg: "$medicines.price" }
            }
        });

        // Add sorting based on the grouped data
        const sortObj: any = {};
        if (sortBy === "medicineName") {
            sortObj["_id.medicineName"] = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "totalQuantity") {
            sortObj["totalQuantity"] = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "totalValue") {
            sortObj["totalValue"] = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "totalBatches") {
            sortObj["totalBatches"] = sortOrder === "asc" ? 1 : -1;
        } else {
            // Default to earliest expiry date
            sortObj["earliestExpiryDate"] = sortOrder === "asc" ? 1 : -1;
        }
        pipeline.push({ $sort: sortObj });

        // Get total count for pagination before applying pagination
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit as string) });

        // Project the final structure
        pipeline.push({
            $project: {
                medicineId: "$_id.medicineId",
                medicineName: "$_id.medicineName",
                totalQuantity: 1,
                totalValue: { $round: ["$totalValue", 2] },
                totalBatches: 1,
                averagePrice: { $round: ["$averagePrice", 2] },
                earliestExpiryDate: 1,
                batches: {
                    $map: {
                        input: "$batches",
                        as: "batch",
                        in: {
                            batchId: "$$batch.batchId",
                            batchNumber: "$$batch.batchNumber",
                            billID: "$$batch.billID",
                            quantity: "$$batch.quantity",
                            price: "$$batch.price",
                            totalAmount: "$$batch.totalAmount",
                            expiryDate: "$$batch.expiryDate",
                            dateOfPurchase: "$$batch.dateOfPurchase",
                            reorderLevel: "$$batch.reorderLevel",
                            createdAt: "$$batch.createdAt",
                            daysExpired: "$$batch.daysExpired"
                        }
                    }
                }
            }
        });

        // Execute aggregation
        const expiredMedicines = await Inventory.aggregate(pipeline);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit as string));
        const hasNextPage = parseInt(page as string) < totalPages;
        const hasPrevPage = parseInt(page as string) > 1;

        // Calculate summary statistics
        const totalExpiredQuantity = expiredMedicines.reduce((sum: number, item: any) => sum + item.totalQuantity, 0);
        const totalExpiredValue = expiredMedicines.reduce((sum: number, item: any) => sum + item.totalValue, 0);
        const totalBatches = expiredMedicines.reduce((sum: number, item: any) => sum + item.totalBatches, 0);

        res.status(200).json({
            success: true,
            data: {
                expiredMedicines,
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalExpiredMedicines: totalCount, // Total unique medicines
                    totalExpiredQuantity,
                    totalExpiredValue: Math.round(totalExpiredValue * 100) / 100,
                    totalBatchesAffected: totalBatches,
                    averageQuantityPerMedicine: totalCount > 0 ? Math.round((totalExpiredQuantity / totalCount) * 100) / 100 : 0,
                    averageValuePerMedicine: totalCount > 0 ? Math.round((totalExpiredValue / totalCount) * 100) / 100 : 0
                }
            }
        });

    } catch (error: any) {
        console.error("Error in getAllExpiredMedicines:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// 2. Discard expired medicines from system
export const discardExpiredMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { 
            batchId, 
            medicineId, 
            quantityToDiscard,
            reason = "Expired"
        } = req.body;

        // Validate required fields
        if (!batchId || !medicineId || !quantityToDiscard) {
            res.status(400).json({
                success: false,
                message: "Batch ID, Medicine ID, and quantity to discard are required"
            });
            return;
        }

        if (quantityToDiscard <= 0) {
            res.status(400).json({
                success: false,
                message: "Quantity to discard must be greater than 0"
            });
            return;
        }

        // Find the batch and specific medicine
        const batch = await Inventory.findById(batchId);
        if (!batch) {
            res.status(404).json({
                success: false,
                message: "Batch not found"
            });
            return;
        }

        // Find the specific medicine in the batch
        const medicineIndex = batch.medicines.findIndex(med => med.medicineId === parseInt(medicineId));
        if (medicineIndex === -1) {
            res.status(404).json({
                success: false,
                message: "Medicine not found in this batch"
            });
            return;
        }

        const medicine = batch.medicines[medicineIndex];
        if (!medicine) {
            res.status(404).json({
                success: false,
                message: "Medicine data not found"
            });
            return;
        }

        // Check if medicine is actually expired
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (medicine.expiryDate >= today) {
            res.status(400).json({
                success: false,
                message: "Medicine is not expired yet. Cannot discard non-expired medicines."
            });
            return;
        }

        // Check if enough quantity available
        if (quantityToDiscard > medicine.quantity) {
            res.status(400).json({
                success: false,
                message: `Not enough quantity available. Available: ${medicine.quantity}, Requested: ${quantityToDiscard}`
            });
            return;
        }

        // Calculate values before updating
        const pricePerUnit = medicine.price;
        const totalDiscardValue = quantityToDiscard * pricePerUnit;
        const remainingQuantity = medicine.quantity - quantityToDiscard;

        // Create discard record
        const discardRecord = new DiscardRecord({
            medicineId: medicine.medicineId,
            medicineName: medicine.medicineName,
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            quantityDiscarded: quantityToDiscard,
            pricePerUnit: pricePerUnit,
            totalValue: totalDiscardValue,
            expiryDate: medicine.expiryDate,
            discardedBy: req.user!._id,
            reason: reason
        });

        await discardRecord.save();

        // Update the medicine quantity in the batch
        if (remainingQuantity === 0) {
            // Remove the medicine entirely if no quantity left
            batch.medicines.splice(medicineIndex, 1);
        } else {
            // Update quantity and total amount with proper null checking
            const medicineToUpdate = batch.medicines[medicineIndex];
            if (medicineToUpdate) {
                medicineToUpdate.quantity = remainingQuantity;
                medicineToUpdate.totalAmount = remainingQuantity * pricePerUnit;
            }
        }

        // Recalculate overall price for the batch
        const newTotalMedicinesPrice = batch.medicines.reduce((sum: number, med) => sum + med.totalAmount, 0);
        batch.overallPrice = newTotalMedicinesPrice + (batch.miscellaneousAmount || 0);

        // Save the updated batch
        await batch.save();

        res.status(200).json({
            success: true,
            message: `Successfully discarded ${quantityToDiscard} units of ${medicine.medicineName} from batch ${batch.batchNumber}`,
            data: {
                discardRecord: {
                    id: discardRecord._id,
                    medicineName: discardRecord.medicineName,
                    batchNumber: discardRecord.batchNumber,
                    quantityDiscarded: discardRecord.quantityDiscarded,
                    totalValue: discardRecord.totalValue,
                    discardedAt: discardRecord.discardedAt
                },
                updatedBatch: {
                    batchId: batch._id,
                    batchNumber: batch.batchNumber,
                    remainingQuantity: remainingQuantity,
                    newOverallPrice: batch.overallPrice
                }
            }
        });

    } catch (error: any) {
        console.error("Error in discardExpiredMedicine:", error);
        
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// 3. Discard specific expired medicine from ALL batches
export const discardExpiredMedicineFromAllBatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { 
            medicineId, 
            medicineName,
            reason = "Expired - All Batches"
        } = req.body;

        // Validate required fields
        if (!medicineId || !medicineName) {
            res.status(400).json({
                success: false,
                message: "Medicine ID and Medicine Name are required"
            });
            return;
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Find all batches containing the expired medicine
        const batchesWithExpiredMedicine = await Inventory.find({
            isDraft: false,
            "medicines.medicineId": parseInt(medicineId),
            "medicines.medicineName": { $regex: new RegExp(`^${medicineName}$`, "i") },
            "medicines.expiryDate": { $lt: today },
            "medicines.quantity": { $gt: 0 }
        });

        if (batchesWithExpiredMedicine.length === 0) {
            res.status(404).json({
                success: false,
                message: `No expired stock found for medicine: ${medicineName}`
            });
            return;
        }

        const discardResults = [];
        let totalDiscardedQuantity = 0;
        let totalDiscardedValue = 0;

        // Process each batch
        for (const batch of batchesWithExpiredMedicine) {
            const medicineIndex = batch.medicines.findIndex(
                med => med.medicineId === parseInt(medicineId) && 
                       med.medicineName.toLowerCase() === medicineName.toLowerCase() &&
                       med.expiryDate < today &&
                       med.quantity > 0
            );

            if (medicineIndex !== -1) {
                const medicine = batch.medicines[medicineIndex];
                if (medicine) {
                    const quantityToDiscard = medicine.quantity;
                    const pricePerUnit = medicine.price;
                    const totalDiscardValue = quantityToDiscard * pricePerUnit;

                    // Create discard record
                    const discardRecord = new DiscardRecord({
                        medicineId: medicine.medicineId,
                        medicineName: medicine.medicineName,
                        batchId: batch._id,
                        batchNumber: batch.batchNumber,
                        quantityDiscarded: quantityToDiscard,
                        pricePerUnit: pricePerUnit,
                        totalValue: totalDiscardValue,
                        expiryDate: medicine.expiryDate,
                        discardedBy: req.user!._id,
                        reason: reason
                    });

                    await discardRecord.save();

                    // Remove the expired medicine from batch
                    batch.medicines.splice(medicineIndex, 1);

                    // Recalculate overall price for the batch
                    const newTotalMedicinesPrice = batch.medicines.reduce((sum: number, med) => sum + med.totalAmount, 0);
                    batch.overallPrice = newTotalMedicinesPrice + (batch.miscellaneousAmount || 0);

                    // Save the updated batch
                    await batch.save();

                    // Track results
                    discardResults.push({
                        batchId: batch._id,
                        batchNumber: batch.batchNumber,
                        quantityDiscarded: quantityToDiscard,
                        valueDiscarded: totalDiscardValue,
                        expiryDate: medicine.expiryDate,
                        pricePerUnit: pricePerUnit
                    });

                    totalDiscardedQuantity += quantityToDiscard;
                    totalDiscardedValue += totalDiscardValue;
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully discarded all expired stock of ${medicineName} from ${discardResults.length} batch(es)`,
            data: {
                medicineName: medicineName,
                medicineId: parseInt(medicineId),
                totalBatchesAffected: discardResults.length,
                totalQuantityDiscarded: totalDiscardedQuantity,
                totalValueDiscarded: Math.round(totalDiscardedValue * 100) / 100,
                averageDiscardValuePerBatch: discardResults.length > 0 ? Math.round((totalDiscardedValue / discardResults.length) * 100) / 100 : 0,
                batchDetails: discardResults,
                discardedBy: req.user!._id,
                discardedAt: new Date()
            }
        });

    } catch (error: any) {
        console.error("Error in discardExpiredMedicineFromAllBatches:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// 4. Get discard history/records
export const getDiscardHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 20,
            search = "",
            sortBy = "discardedAt",
            sortOrder = "desc",
            userId = "",
            dateFrom = "",
            dateTo = ""
        } = req.query;

        // Build search query
        const searchQuery: any = {};

        // Text search
        if (search) {
            searchQuery.$or = [
                { medicineName: { $regex: search, $options: "i" } },
                { batchNumber: { $regex: search, $options: "i" } },
                { reason: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by user if provided
        if (userId) {
            searchQuery.discardedBy = userId;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            searchQuery.discardedAt = {};
            if (dateFrom) {
                searchQuery.discardedAt.$gte = new Date(dateFrom as string);
            }
            if (dateTo) {
                const endDate = new Date(dateTo as string);
                endDate.setHours(23, 59, 59, 999);
                searchQuery.discardedAt.$lte = endDate;
            }
        }

        // Build sort object
        const sortObj: any = {};
        sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Execute query with pagination
        const [discardRecords, totalCount] = await Promise.all([
            DiscardRecord.find(searchQuery)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit as string))
                .populate('discardedBy', 'name email username')
                .lean(),
            DiscardRecord.countDocuments(searchQuery)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit as string));
        const hasNextPage = parseInt(page as string) < totalPages;
        const hasPrevPage = parseInt(page as string) > 1;

        // Calculate summary statistics with proper typing
        const totalDiscardedQuantity = discardRecords.reduce((sum: number, record: any) => sum + record.quantityDiscarded, 0);
        const totalDiscardedValue = discardRecords.reduce((sum: number, record: any) => sum + record.totalValue, 0);
        const uniqueMedicines = [...new Set(discardRecords.map((record: any) => record.medicineName))].length;
        const uniqueUsers = [...new Set(discardRecords.map((record: any) => record.discardedBy.toString()))].length;

        res.status(200).json({
            success: true,
            data: {
                discardRecords,
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalDiscardRecords: totalCount,
                    totalDiscardedQuantity,
                    totalDiscardedValue: Math.round(totalDiscardedValue * 100) / 100,
                    uniqueMedicinesDiscarded: uniqueMedicines,
                    uniqueUsersInvolved: uniqueUsers,
                    averageDiscardValuePerRecord: totalCount > 0 ? Math.round((totalDiscardedValue / totalCount) * 100) / 100 : 0
                }
            }
        });

    } catch (error: any) {
        console.error("Error in getDiscardHistory:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


