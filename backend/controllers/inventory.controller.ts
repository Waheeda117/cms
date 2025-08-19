import { Request, Response } from "express";
import { Inventory, IInventory, IBatchMedicine } from "../models/inventory.model.js";
import { AuthenticatedRequest } from "../types/index.js";
import { ActivityLogService } from "../services/activityLog.service.js";
import mongoose from "mongoose";
import { PipelineStage } from 'mongoose';


interface MedicineData {
    medicineId: number;
    medicineName: string;
    quantity: number;
    price: number;
    expiryDate: string | Date;
    dateOfPurchase: string | Date;
    reorderLevel: number;
    totalAmount?: number;
}

interface AddToStockData {
    batchNumber: string;
    billID: string;
    medicines: MedicineData[];
    overallPrice: number;
    attachments?: string[];
    miscellaneousAmount?: number;
}

interface DraftBatchData {
    batchNumber: string;
    billID: string;
    medicines: MedicineData[];
    overallPrice: number;
    attachments?: string[];
    miscellaneousAmount?: number;
    draftNote?: string;
}

export const addToStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            batchNumber,
            billID,
            medicines, // Array of medicine objects
            overallPrice,
            attachments = [],
            miscellaneousAmount = 0
        } = req.body;

        // Validate required fields
        if (!batchNumber || !billID || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !overallPrice) {
            res.status(400).json({
                success: false,
                message: "All fields are required. Medicines must be a non-empty array."
            });
            return;
        }

        // Validate miscellaneous amount
        if (miscellaneousAmount < 0) {
            res.status(400).json({
                success: false,
                message: "Miscellaneous amount cannot be negative"
            });
            return;
        }

        // Check for duplicate medicine IDs within the same batch
        const medicineIds = medicines.map(med => med.medicineId).filter(id => id !== null);
        const uniqueMedicineIds = [...new Set(medicineIds)];
        
        if (medicineIds.length !== uniqueMedicineIds.length) {
            res.status(400).json({
                success: false,
                message: "Duplicate medicines are not allowed in the same batch"
            });
            return;
        }

        // Validate each medicine in the array
        for (const medicine of medicines) {
            const { medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
            
            if (!medicineId || !medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                res.status(400).json({
                    success: false,
                    message: "All medicine fields are required: medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel"
                });
                return;
            }

            if (quantity <= 0 || price <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Quantity and price must be greater than 0"
                });
                return;
            }

            // Calculate total amount for each medicine
            medicine.totalAmount = quantity * price;
        }

        // Calculate total medicines price
        const totalMedicinesPrice = medicines.reduce((sum, medicine) => sum + (medicine.totalAmount || 0), 0);
        
        // Validate price matching with miscellaneous amount
        const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
        const priceDifference = Math.abs(totalWithMiscellaneous - overallPrice);
        
        if (priceDifference > 0.01) { // Allow small floating point tolerance
            res.status(400).json({
                success: false,
                message: `Total medicines price (${totalMedicinesPrice}) plus miscellaneous amount (${miscellaneousAmount}) must equal overall price (${overallPrice})`
            });
            return;
        }

        // Check if batch already exists
        const existingBatch = await Inventory.findOne({ batchNumber });

        if (existingBatch) {
            res.status(400).json({
                success: false,
                message: "Batch number already exists. Please use a different batch number."
            });
            return;
        }

        // Create new batch
        const newBatch = new Inventory({
            batchNumber,
            billID,
            medicines,
            overallPrice,
            miscellaneousAmount,
            attachments,
            createdBy: req.user!._id
        });

        await newBatch.save();

        // Log the activity for finalized batch
        await ActivityLogService.logBatchCreated(newBatch, new mongoose.Types.ObjectId(req.user!._id), false);

        res.status(201).json({
            success: true,
            message: `New batch created successfully with ${medicines.length} medicines${miscellaneousAmount > 0 ? ' and miscellaneous amount' : ''}`,
            data: newBatch
        });

    } catch (error: any) {
        console.error("Error in addToStock:", error);
        
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Batch number already exists"
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

export const addDraftBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            batchNumber,
            billID,
            medicines,
            overallPrice,
            attachments = [],
            miscellaneousAmount = 0,
            draftNote = ''
        } = req.body;

        // Same validation as addToStock but save as draft
        if (!batchNumber || !billID || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !overallPrice) {
            res.status(400).json({
                success: false,
                message: "All fields are required. Medicines must be a non-empty array."
            });
            return;
        }

        // Validate miscellaneous amount
        if (miscellaneousAmount < 0) {
            res.status(400).json({
                success: false,
                message: "Miscellaneous amount cannot be negative"
            });
            return;
        }

        // Check for duplicate medicine IDs within the same batch
        const medicineIds = medicines.map(med => med.medicineId).filter(id => id !== null);
        const uniqueMedicineIds = [...new Set(medicineIds)];
        
        if (medicineIds.length !== uniqueMedicineIds.length) {
            res.status(400).json({
                success: false,
                message: "Duplicate medicines are not allowed in the same batch"
            });
            return;
        }

        // Validate each medicine
        for (const medicine of medicines) {
            const { medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
            
            if (!medicineId || !medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                res.status(400).json({
                    success: false,
                    message: "All medicine fields are required"
                });
                return;
            }

            if (quantity <= 0 || price <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Quantity and price must be greater than 0"
                });
                return;
            }

            medicine.totalAmount = quantity * price;
        }

        // Validate price matching
        const totalMedicinesPrice = medicines.reduce((sum, medicine) => sum + (medicine.totalAmount || 0), 0);
        const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
        const priceDifference = Math.abs(totalWithMiscellaneous - overallPrice);
        
        if (priceDifference > 0.01) {
            res.status(400).json({
                success: false,
                message: `Total medicines price plus miscellaneous amount must equal overall price`
            });
            return;
        }

        // Check if batch already exists
        const existingBatch = await Inventory.findOne({ batchNumber });
        if (existingBatch) {
            res.status(400).json({
                success: false,
                message: "Batch number already exists. Please use a different batch number."
            });
            return;
        }

        // Create new DRAFT batch
        const newDraftBatch = new Inventory({
            batchNumber,
            billID,
            medicines,
            overallPrice,
            miscellaneousAmount,
            attachments,
            isDraft: true, // Mark as draft
            draftNote,
            createdBy: req.user!._id
        });

        await newDraftBatch.save();

        // Log the initial draft creation
        await ActivityLogService.logDraftBatchCreated(newDraftBatch, new mongoose.Types.ObjectId(req.user!._id));

        res.status(201).json({
            success: true,
            message: `Draft batch created successfully with ${medicines.length} medicines. This batch will not affect stock levels until finalized.`,
            data: newDraftBatch
        });

    } catch (error: any) {
        console.error("Error in addDraftBatch:", error);
        
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Batch number already exists"
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

export const finalizeDraftBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
            return;
        }

        const batch = await Inventory.findById(id);
        if (!batch) {
            res.status(404).json({
                success: false,
                message: "Batch not found"
            });
            return;
        }

        if (!batch.isDraft) {
            res.status(400).json({
                success: false,
                message: "This batch is already finalized"
            });
            return;
        }

        // Finalize the batch
        batch.isDraft = false;
        batch.finalizedAt = new Date();
        await batch.save();

        // Log the finalization
        await ActivityLogService.logBatchFinalized(batch, new mongoose.Types.ObjectId(req.user!._id));

        res.status(200).json({
            success: true,
            message: "Draft batch finalized successfully. Stock levels have been updated.",
            data: batch
        });

    } catch (error: any) {
        console.error("Error in finalizeDraftBatch:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const stockList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc",
            includeDrafts = "true"
        } = req.query;

        // Build search query
        const searchQuery: any = {};

        // Filter drafts based on parameter
        if (includeDrafts === "false") {
            searchQuery.isDraft = false;
        }

        // Text search
        if (search) {
            searchQuery.$or = [
                { batchNumber: { $regex: search, $options: "i" } },
                { billID: { $regex: search, $options: "i" } },
                { "medicines.medicineName": { $regex: search, $options: "i" } }
            ];
        }

        // Build sort object
        const sortObj: any = {};
        sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Execute query with pagination
        const [batches, totalCount] = await Promise.all([
            Inventory.find(searchQuery)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit as string))
                .populate('createdBy', 'name email')
                .lean(),
            Inventory.countDocuments(searchQuery)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit as string));
        const hasNextPage = parseInt(page as string) < totalPages;
        const hasPrevPage = parseInt(page as string) > 1;

        // Add status and additional info to each batch
        const enrichedBatches = batches.map(batch => {
            const totalMedicines = batch.medicines.length;
            const totalQuantity = batch.medicines.reduce((sum, med) => sum + med.quantity, 0);
            const totalMedicinesPrice = batch.medicines.reduce((sum, med) => sum + med.totalAmount, 0);
            const lowStockMedicines = batch.medicines.filter(med => med.quantity <= med.reorderLevel).length;
            const expiredMedicines = batch.medicines.filter(med => new Date(med.expiryDate) < new Date()).length;

            return {
                ...batch,
                isDraft: batch.isDraft, // Include draft status
                draftNote: batch.draftNote,
                finalizedAt: batch.finalizedAt,
                summary: {
                    totalMedicines,
                    totalQuantity,
                    totalMedicinesPrice,
                    miscellaneousAmount: batch.miscellaneousAmount || 0,
                    lowStockMedicines,
                    expiredMedicines,
                    batchStatus: batch.isDraft 
                        ? "Draft" 
                        : lowStockMedicines > 0 
                            ? "Has Low Stock" 
                            : expiredMedicines > 0 
                                ? "Has Expired Items" 
                                : "Good"
                }
            };
        });

        res.status(200).json({
            success: true,
            data: {
                batches: enrichedBatches,
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalBatches: totalCount,
                    draftBatches: enrichedBatches.filter(batch => batch.isDraft).length,
                    finalizedBatches: enrichedBatches.filter(batch => !batch.isDraft).length,
                    totalMedicines: enrichedBatches.reduce((sum, batch) => sum + batch.summary.totalMedicines, 0),
                    totalMiscellaneousAmount: enrichedBatches.reduce((sum, batch) => sum + batch.summary.miscellaneousAmount, 0),
                    batchesWithLowStock: enrichedBatches.filter(batch => batch.summary.lowStockMedicines > 0).length,
                    batchesWithExpiredItems: enrichedBatches.filter(batch => batch.summary.expiredMedicines > 0).length
                }
            }
        });

    } catch (error: any) {
        console.error("Error in stockList:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const allStocksList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            sortBy = "medicineName",
            sortOrder = "asc"
        } = req.query;

        // Build aggregation pipeline to flatten medicines across all batches
        const pipeline: any[] = [];

        // IMPORTANT: Only include finalized batches in stock calculations
        pipeline.push({ $match: { isDraft: false } });

        // Unwind medicines array to treat each medicine as a separate document
        pipeline.push({ $unwind: "$medicines" });

        // Match stage for filtering
        const matchStage: any = {};
        if (search) {
            matchStage.$or = [
                { "medicines.medicineName": { $regex: search, $options: "i" } },
                { batchNumber: { $regex: search, $options: "i" } },
                { billID: { $regex: search, $options: "i" } }
            ];
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        // Sort by creation date to get the latest batch first for each medicine
        pipeline.push({ $sort: { createdAt: -1 } });

        // Group by medicine name to aggregate quantities across batches
        pipeline.push({
            $group: {
                _id: "$medicines.medicineName",
                totalQuantity: { $sum: "$medicines.quantity" },
                totalValue: { $sum: "$medicines.totalAmount" },
                batches: {
                    $push: {
                        batchId: "$_id",
                        batchNumber: "$batchNumber",
                        billID: "$billID",
                        quantity: "$medicines.quantity",
                        price: "$medicines.price",
                        expiryDate: "$medicines.expiryDate",
                        dateOfPurchase: "$medicines.dateOfPurchase",
                        reorderLevel: "$medicines.reorderLevel",
                        totalAmount: "$medicines.totalAmount",
                        createdAt: "$createdAt",
                        medicineId: "$medicines.medicineId"
                    }
                },
                // Get the last (most recent) batch details
                lastBatch: {
                    $first: {
                        batchId: "$_id",
                        batchNumber: "$batchNumber",
                        billID: "$billID",
                        quantity: "$medicines.quantity",
                        price: "$medicines.price",
                        expiryDate: "$medicines.expiryDate",
                        dateOfPurchase: "$medicines.dateOfPurchase",
                        reorderLevel: "$medicines.reorderLevel",
                        totalAmount: "$medicines.totalAmount",
                        createdAt: "$createdAt",
                        medicineId: "$medicines.medicineId",
                        overallPrice: "$overallPrice",
                        miscellaneousAmount: "$miscellaneousAmount",
                        attachments: "$attachments"
                    }
                },
                avgPrice: { $avg: "$medicines.price" },
                minReorderLevel: { $min: "$medicines.reorderLevel" },
                batchCount: { $sum: 1 },
                medicineId: { $first: "$medicines.medicineId" },
                // Check if any batch of this medicine is already expired
                expiredBatches: {
                    $push: {
                        $cond: {
                            if: {
                                $lt: ["$medicines.expiryDate", new Date()]
                            },
                            then: {
                                batchId: "$_id",
                                batchNumber: "$batchNumber",
                                expiryDate: "$medicines.expiryDate",
                                quantity: "$medicines.quantity"
                            },
                            else: null
                        }
                    }
                },
                // Check if any batch of this medicine expires within 10 days (but not expired yet)
                expiringBatches: {
                    $push: {
                        $cond: {
                            if: {
                                $and: [
                                    { $gte: ["$medicines.expiryDate", new Date()] }, // Not expired yet
                                    {
                                        $lte: [
                                            "$medicines.expiryDate",
                                            { $dateAdd: { startDate: new Date(), unit: "day", amount: 10 } }
                                        ]
                                    }
                                ]
                            },
                            then: {
                                batchId: "$_id",
                                batchNumber: "$batchNumber",
                                expiryDate: "$medicines.expiryDate",
                                quantity: "$medicines.quantity"
                            },
                            else: null
                        }
                    }
                }
            }
        });

        // Project to reshape output
        pipeline.push({
            $project: {
                _id: 0,
                medicineId: 1,
                medicineName: "$_id",
                totalQuantity: 1,
                totalValue: 1,
                avgPrice: { $round: ["$avgPrice", 2] },
                batchCount: 1,
                batches: 1,
                lastBatch: 1,
                reorderLevel: "$minReorderLevel",
                status: {
                    $cond: {
                        if: { $lte: ["$totalQuantity", "$minReorderLevel"] },
                        then: "Low Stock",
                        else: "In Stock"
                    }
                },
                // Filter out null values from expired batches
                expiredBatches: {
                    $filter: {
                        input: "$expiredBatches",
                        cond: { $ne: ["$$this", null] }
                    }
                },
                // Filter out null values from expiring batches
                expiringBatches: {
                    $filter: {
                        input: "$expiringBatches",
                        cond: { $ne: ["$$this", null] }
                    }
                },
                // Check if this medicine has expired batches
                hasExpiredBatches: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$expiredBatches",
                                    cond: { $ne: ["$$this", null] }
                                }
                            }
                        },
                        0
                    ]
                },
                // Check if this medicine has expiring batches
                hasExpiringBatches: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$expiringBatches",
                                    cond: { $ne: ["$$this", null] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        });

        // Sort stage
        const sortObj: any = {};
        sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;
        pipeline.push({ $sort: sortObj });

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit as string) });

        // Execute aggregation
        const medicines = await Inventory.aggregate(pipeline);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit as string));
        const hasNextPage = parseInt(page as string) < totalPages;
        const hasPrevPage = parseInt(page as string) > 1;

        // Calculate summary statistics
        const lowStockCount = medicines.filter(item => item.status === "Low Stock").length;
        const totalBatches = medicines.reduce((sum, item) => sum + item.batchCount, 0);
        const totalInventoryValue = medicines.reduce((sum, item) => sum + item.totalValue, 0);
        
        // Count medicines with expired batches
        const expiredMedicinesCount = medicines.filter(item => item.hasExpiredBatches).length;
        
        // Count medicines with expiring batches (within 10 days, but not expired yet)
        const expiringMedicinesCount = medicines.filter(item => item.hasExpiringBatches).length;

        res.status(200).json({
            success: true,
            data: {
                medicines,
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalMedicines: totalCount,
                    lowStockMedicines: lowStockCount,
                    totalBatches: totalBatches,
                    totalInventoryValue: totalInventoryValue,
                    expiredMedicines: expiredMedicinesCount, // New field for expired medicines
                    expiringWithin10Days: expiringMedicinesCount // New field for expiring medicines
                }
            }
        });

    } catch (error: any) {
        console.error("Error in allStocksList:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const getBatchById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
            return;
        }

        // Find the batch by ID
        const batch = await Inventory.findById(id).populate('createdBy', 'name email username');
        
        if (!batch) {
            res.status(404).json({
                success: false,
                message: "Batch not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Batch retrieved successfully",
            data: batch
        });

    } catch (error: any) {
        console.error("Error in getBatchById:", error);
        
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
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

export const getStockById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { medicineName } = req.params;
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        if (!medicineName) {
            res.status(400).json({
                success: false,
                message: "Medicine name is required"
            });
            return;
        }

        // Decode the medicine name in case it's URL encoded
        const decodedMedicineName = decodeURIComponent(medicineName);

        // Build aggregation pipeline
        const pipeline: any[] = [];

        // Match documents that contain the specific medicine
        pipeline.push({
            $match: {
                "medicines.medicineName": { $regex: new RegExp(`^${decodedMedicineName}$`, "i") }
            }
        });

        // Unwind medicines array
        pipeline.push({ $unwind: "$medicines" });

        // Match only the specific medicine after unwinding
        pipeline.push({
            $match: {
                "medicines.medicineName": { $regex: new RegExp(`^${decodedMedicineName}$`, "i") }
            }
        });

        // Add batch information to each medicine entry
        pipeline.push({
            $project: {
                _id: 1,
                batchNumber: 1,
                billID: 1,
                overallPrice: 1,
                miscellaneousAmount: 1,
                attachments: 1,
                createdAt: 1,
                updatedAt: 1,
                createdBy: 1,
                medicine: {
                    medicineId: "$medicines.medicineId",
                    medicineName: "$medicines.medicineName",
                    quantity: "$medicines.quantity",
                    price: "$medicines.price",
                    expiryDate: "$medicines.expiryDate",
                    dateOfPurchase: "$medicines.dateOfPurchase",
                    reorderLevel: "$medicines.reorderLevel",
                    totalAmount: "$medicines.totalAmount",
                    status: {
                        $cond: {
                            if: { $lte: ["$medicines.quantity", "$medicines.reorderLevel"] },
                            then: "Low Stock",
                            else: "In Stock"
                        }
                    },
                    expiryStatus: {
                        $cond: {
                            if: { $lt: ["$medicines.expiryDate", new Date()] },
                            then: "Expired",
                            else: {
                                $cond: {
                                    if: { 
                                        $lte: [
                                            "$medicines.expiryDate", 
                                            { $add: [new Date(), 30 * 24 * 60 * 60 * 1000] } // 30 days from now
                                        ] 
                                    },
                                    then: "Expiring Soon",
                                    else: "Good"
                                }
                            }
                        }
                    }
                }
            }
        });

        // Sort stage
        const sortObj: any = {};
        sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;
        pipeline.push({ $sort: sortObj });

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        if (totalCount === 0) {
            res.status(404).json({
                success: false,
                message: `No stock found for medicine: ${decodedMedicineName}`
            });
            return;
        }

        // Add pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit as string) });

        // Populate createdBy field
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                    { $project: { name: 1, email: 1 } }
                ]
            }
        });

        pipeline.push({
            $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true
            }
        });

        // Execute aggregation
        const stockEntries = await Inventory.aggregate(pipeline);

        // Calculate summary statistics
        const totalQuantity = stockEntries.reduce((sum, entry) => sum + entry.medicine.quantity, 0);
        const totalValue = stockEntries.reduce((sum, entry) => sum + entry.medicine.totalAmount, 0);
        const avgPrice = stockEntries.length > 0 ? totalValue / totalQuantity : 0;
        const lowStockEntries = stockEntries.filter(entry => entry.medicine.status === "Low Stock").length;
        const expiredEntries = stockEntries.filter(entry => entry.medicine.expiryStatus === "Expired").length;
        const expiringSoonEntries = stockEntries.filter(entry => entry.medicine.expiryStatus === "Expiring Soon").length;

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit as string));
        const hasNextPage = parseInt(page as string) < totalPages;
        const hasPrevPage = parseInt(page as string) > 1;

        res.status(200).json({
            success: true,
            data: {
                medicineName: decodedMedicineName,
                stockEntries,
                pagination: {
                    currentPage: parseInt(page as string),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit as string),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalBatches: totalCount,
                    totalQuantity: totalQuantity,
                    totalValue: Math.round(totalValue * 100) / 100,
                    averagePrice: Math.round(avgPrice * 100) / 100,
                    lowStockBatches: lowStockEntries,
                    expiredBatches: expiredEntries,
                    expiringSoonBatches: expiringSoonEntries,
                    overallStatus: lowStockEntries > 0 ? "Low Stock" : expiredEntries > 0 ? "Has Expired Items" : expiringSoonEntries > 0 ? "Has Expiring Items" : "Good"
                }
            }
        });

    } catch (error: any) {
        console.error("Error in getStockById:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteStockById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
            return;
        }

        const batchToDelete = await Inventory.findById(id);
        if (!batchToDelete) {
            res.status(404).json({
                success: false,
                message: "Batch not found"
            });
            return;
        }

        // Log the deletion before actually deleting
        await ActivityLogService.logBatchDeleted(batchToDelete, new mongoose.Types.ObjectId(req.user!._id));

        // Delete the batch
        await Inventory.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: `Batch deleted successfully`,
            data: {
                deletedBatch: {
                    id: batchToDelete._id,
                    batchNumber: batchToDelete.batchNumber,
                    billID: batchToDelete.billID,
                    medicineCount: batchToDelete.medicines.length,
                    overallPrice: batchToDelete.overallPrice
                }
            }
        });

    } catch (error: any) {
        console.error("Error in deleteStockById:", error);
        
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
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

export const updateBatchById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate if ID is provided
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
            return;
        }

        // Check if batch exists
        const existingBatch = await Inventory.findById(id);
        if (!existingBatch) {
            res.status(404).json({
                success: false,
                message: "Batch not found"
            });
            return;
        }

        // If updating a draft batch, allow all updates
        // If updating a finalized batch, prevent certain changes if needed
        if (!existingBatch.isDraft && updateData.isDraft === true) {
            res.status(400).json({
                success: false,
                message: "Cannot convert a finalized batch back to draft"
            });
            return;
        }

        // If finalizing a draft (isDraft: false), set finalizedAt
        if (existingBatch.isDraft && updateData.isDraft === false) {
            updateData.finalizedAt = new Date();
        }

        // If batchNumber is being updated, check for uniqueness
        if (updateData.batchNumber && updateData.batchNumber !== existingBatch.batchNumber) {
            const batchExists = await Inventory.findOne({ 
                batchNumber: updateData.batchNumber,
                _id: { $ne: id } // Exclude current batch
            });
            
            if (batchExists) {
                res.status(400).json({
                    success: false,
                    message: "Batch number already exists. Please use a different batch number."
                });
                return;
            }
        }

        // Validate medicines array if provided
        if (updateData.medicines) {
            if (!Array.isArray(updateData.medicines)) {
                res.status(400).json({
                    success: false,
                    message: "Medicines must be an array"
                });
                return;
            }

            // Check for duplicate medicine IDs within the batch
            const medicineIds = updateData.medicines.map((med: any) => med.medicineId).filter((id: any) => id !== null && id !== undefined);
            const uniqueMedicineIds = [...new Set(medicineIds)];
            
            if (medicineIds.length !== uniqueMedicineIds.length) {
                res.status(400).json({
                    success: false,
                    message: "Duplicate medicines are not allowed in the same batch. Each medicine can only be added once."
                });
                return;
            }

            // Validate each medicine in the array
            for (const medicine of updateData.medicines) {
                const { medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
                
                // Validate required fields including medicineId
                if (!medicineId || !medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                    res.status(400).json({
                        success: false,
                        message: "All medicine fields are required: medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel"
                    });
                    return;
                }

                // Validate medicineId is a positive number
                if (!Number.isInteger(medicineId) || medicineId <= 0) {
                    res.status(400).json({
                        success: false,
                        message: "Medicine ID must be a positive integer"
                    });
                    return;
                }

                if (quantity <= 0 || price <= 0) {
                    res.status(400).json({
                        success: false,
                        message: "Quantity and price must be greater than 0"
                    });
                    return;
                }

                // Validate quantity and price are numbers
                if (!Number.isInteger(quantity) || isNaN(parseFloat(price))) {
                    res.status(400).json({
                        success: false,
                        message: "Quantity must be an integer and price must be a valid number"
                    });
                    return;
                }

                // Validate dates
                if (isNaN(Date.parse(expiryDate)) || isNaN(Date.parse(dateOfPurchase))) {
                    res.status(400).json({
                        success: false,
                        message: "Invalid date format for expiryDate or dateOfPurchase"
                    });
                    return;
                }

                // Validate reorderLevel
                if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
                    res.status(400).json({
                        success: false,
                        message: "Reorder level must be a non-negative integer"
                    });
                    return;
                }

                // Calculate total amount for each medicine
                medicine.totalAmount = quantity * price;
            }
        }

        // Validate miscellaneous amount if provided
        if (updateData.miscellaneousAmount !== undefined) {
            if (isNaN(parseFloat(updateData.miscellaneousAmount)) || updateData.miscellaneousAmount < 0) {
                res.status(400).json({
                    success: false,
                    message: "Miscellaneous amount must be a non-negative number"
                });
                return;
            }
        }

        // Validate other numeric fields if provided
        if (updateData.overallPrice !== undefined) {
            if (isNaN(parseFloat(updateData.overallPrice)) || updateData.overallPrice < 0) {
                res.status(400).json({
                    success: false,
                    message: "Overall price must be a non-negative number"
                });
                return;
            }
        }

        // If both medicines and overallPrice are being updated, validate total
        if (updateData.medicines && updateData.overallPrice !== undefined) {
            const totalMedicinesPrice = updateData.medicines.reduce((sum: number, medicine: any) => sum + medicine.totalAmount, 0);
            const miscellaneousAmount = updateData.miscellaneousAmount !== undefined ? updateData.miscellaneousAmount : (existingBatch.miscellaneousAmount || 0);
            const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
            const priceDifference = Math.abs(totalWithMiscellaneous - updateData.overallPrice);
            
            if (priceDifference > 0.01) { // Allow small floating point tolerance
                res.status(400).json({
                    success: false,
                    message: `Total medicines price (${totalMedicinesPrice.toFixed(2)}) plus miscellaneous amount (${miscellaneousAmount.toFixed(2)}) must equal overall price (${parseFloat(updateData.overallPrice).toFixed(2)}). Current difference: ${priceDifference.toFixed(2)}`
                });
                return;
            }
        }

        // If only medicines are being updated but overallPrice exists, validate against existing overallPrice
        if (updateData.medicines && updateData.overallPrice === undefined && existingBatch.overallPrice) {
            const totalMedicinesPrice = updateData.medicines.reduce((sum: number, medicine: any) => sum + medicine.totalAmount, 0);
            const miscellaneousAmount = updateData.miscellaneousAmount !== undefined ? updateData.miscellaneousAmount : (existingBatch.miscellaneousAmount || 0);
            const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
            const priceDifference = Math.abs(totalWithMiscellaneous - existingBatch.overallPrice);
            
            if (priceDifference > 0.01) {
                res.status(400).json({
                    success: false,
                    message: `Total medicines price (${totalMedicinesPrice.toFixed(2)}) plus miscellaneous amount (${miscellaneousAmount.toFixed(2)}) must equal existing overall price (${existingBatch.overallPrice.toFixed(2)}). Current difference: ${priceDifference.toFixed(2)}`
                });
                return;
            }
        }

        // Validate attachments array if provided
        if (updateData.attachments !== undefined) {
            if (!Array.isArray(updateData.attachments)) {
                res.status(400).json({
                    success: false,
                    message: "Attachments must be an array"
                });
                return;
            }

            // Validate each attachment URL
            for (const attachment of updateData.attachments) {
                if (typeof attachment !== 'string' || attachment.trim() === '') {
                    res.status(400).json({
                        success: false,
                        message: "Each attachment must be a valid URL string"
                    });
                    return;
                }
            }
        }

        // Store the old batch data before update
        const oldBatch = existingBatch.toObject();

        // Update the batch with partial data
        const updatedBatch = await Inventory.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        if (!updatedBatch) {
            res.status(404).json({
                success: false,
                message: "Batch not found"
            });
            return;
        }

        // Log the update activity (will handle draft vs finalized logic internally)
        await ActivityLogService.logBatchUpdated(
            updatedBatch, 
            new mongoose.Types.ObjectId(req.user!._id), 
            updateData, 
            oldBatch
        );

        // Prepare response with summary information
        const totalMedicines = updatedBatch.medicines.length;
        const totalQuantity = updatedBatch.medicines.reduce((sum, med) => sum + med.quantity, 0);
        const totalMedicinesPrice = updatedBatch.medicines.reduce((sum, med) => sum + med.totalAmount, 0);
        const lowStockMedicines = updatedBatch.medicines.filter(med => med.quantity <= med.reorderLevel).length;
        const expiredMedicines = updatedBatch.medicines.filter(med => new Date(med.expiryDate) < new Date()).length;

        res.status(200).json({
            success: true,
            message: `${updatedBatch.isDraft ? 'Draft batch' : 'Batch'} updated successfully`,
            data: {
                ...updatedBatch.toObject(),
                summary: {
                    totalMedicines,
                    totalQuantity,
                    totalMedicinesPrice,
                    miscellaneousAmount: updatedBatch.miscellaneousAmount || 0,
                    lowStockMedicines,
                    expiredMedicines,
                    batchStatus: updatedBatch.isDraft 
                        ? "Draft" 
                        : lowStockMedicines > 0 
                            ? "Has Low Stock" 
                            : expiredMedicines > 0 
                                ? "Has Expired Items" 
                                : "Good"
                }
            }
        });

    } catch (error: any) {
        console.error("Error in updateBatchById:", error);
        
        if (error.name === 'CastError') {
            res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
            return;
        }

        if (error.code === 11000) {
            // Handle duplicate key errors
            const duplicateField = Object.keys(error.keyPattern)[0];
            res.status(400).json({
                success: false,
                message: `${duplicateField} already exists. Please use a different value.`
            });
            return;
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { dateRange = "this_month" } = req.query;
        
        // Calculate date ranges for trends
        const now = new Date();
        let startDate: Date, endDate: Date;
        
        if (dateRange === "this_week") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            endDate = now;
        } else {
            // Default to this_month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
        }

        // Parallel execution of all dashboard queries
        const [
            summaryStats,
            stockTrends,
            topStockedMedicines,
            lowStockItems,
            expiringSoonItems,
            alreadyExpiredItems
        ] = await Promise.all([
            getSummaryStats(),
            getStockTrends(startDate, endDate, dateRange as string),
            getTopStockedMedicines(),
            getLowStockItems(),
            getExpiringSoonItems(),
            getAlreadyExpiredItems()
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: summaryStats,
                stockTrends,
                topStockedMedicines,
                lowStockItems,
                expiringSoonItems,
                alreadyExpiredItems
            }
        });

    } catch (error: any) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Helper function for summary statistics
const getSummaryStats = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Start of tomorrow
    
    // Pipeline for general stats (total items, near expiry, already expired)
    const generalStatsPipeline = [
        { $match: { isDraft: false } },
        { $unwind: "$medicines" },
        {
            $project: {
                medicineName: "$medicines.medicineName",
                batchNumber: "$batchNumber",
                quantity: "$medicines.quantity",
                totalValue: "$medicines.totalAmount",
                reorderLevel: "$medicines.reorderLevel",
                expiryDate: "$medicines.expiryDate",
                // Items expiring today or within 10 days from tomorrow
                isNearExpiry: {
                    $and: [
                        { $gte: ["$medicines.expiryDate", todayStart] }, // >= today (includes today)
                        {
                            $lte: [
                                "$medicines.expiryDate",
                                { $dateAdd: { startDate: todayStart, unit: "day", amount: 10 } }
                            ]
                        }
                    ]
                },
                // Items expired before today
                isAlreadyExpired: {
                    $lt: ["$medicines.expiryDate", todayStart] // < today (excludes today)
                }
            }
        }
    ];

    // Pipeline for low stock count (grouped by medicine name)
    const lowStockPipeline = [
        { $match: { isDraft: false } },
        { $unwind: "$medicines" },
        {
            $group: {
                _id: "$medicines.medicineName",
                totalQuantity: { $sum: "$medicines.quantity" },
                minReorderLevel: { $min: "$medicines.reorderLevel" }
            }
        },
        {
            $match: {
                $expr: { $lte: ["$totalQuantity", "$minReorderLevel"] }
            }
        },
        {
            $count: "lowStockCount"
        }
    ];

    // Execute both pipelines
    const [generalResults, lowStockResults] = await Promise.all([
        Inventory.aggregate(generalStatsPipeline),
        Inventory.aggregate(lowStockPipeline)
    ]);
    
    const totalItems = generalResults.length;
    const nearExpiryCount = generalResults.filter(item => item.isNearExpiry).length;
    const alreadyExpiredCount = generalResults.filter(item => item.isAlreadyExpired).length;
    const totalStockValue = generalResults.reduce((sum, item) => sum + item.totalValue, 0);
    
    // Get the correct low stock count
    const lowStockCount = lowStockResults.length > 0 ? lowStockResults[0].lowStockCount : 0;

    // Format stock value in thousands (K)
    let formattedStockValue: string;
    if (totalStockValue >= 1000) {
        formattedStockValue = (totalStockValue / 1000).toFixed(1) + "K";
    } else {
        formattedStockValue = totalStockValue.toString();
    }

    return {
        totalItems,
        lowStock: lowStockCount,
        nearExpiry: nearExpiryCount,
        alreadyExpired: alreadyExpiredCount,
        stockValue: formattedStockValue
    };
};

const getStockTrends = async (startDate: Date, endDate: Date, dateRange: string) => {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                isDraft: false,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        { $unwind: "$medicines" },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: dateRange === "this_week" ? "%Y-%m-%d" : "%Y-%m-%d",
                        date: "$createdAt"
                    }
                },
                totalAdded: { $sum: "$medicines.quantity" }
            }
        },
        { $sort: { "_id": 1 } }
    ];

    const results = await Inventory.aggregate(pipeline);
    
    // Format data for chart
    if (dateRange === "this_week") {
        return results.map((item: any, index: number) => ({
            week: `Day ${index + 1}`,
            stock: item.totalAdded
        }));
    } else {
        // Group by weeks for monthly view
        const weeklyData: any[] = [];
        let weekCounter = 1;
        let currentWeekStock = 0;
        
        results.forEach((item: any, index: number) => {
            currentWeekStock += item.totalAdded;
            
            if ((index + 1) % 7 === 0 || index === results.length - 1) {
                weeklyData.push({
                    week: `Week ${weekCounter}`,
                    stock: currentWeekStock
                });
                weekCounter++;
                currentWeekStock = 0;
            }
        });
        
        return weeklyData.length > 0 ? weeklyData : [
            { week: "Week 1", stock: 320 },
            { week: "Week 2", stock: 295 },
            { week: "Week 3", stock: 310 },
            { week: "Week 4", stock: 342 }
        ];
    }
};

// Helper function for top stocked medicines
const getTopStockedMedicines = async () => {
    const pipeline: PipelineStage[] = [
        { $match: { isDraft: false } },
        { $unwind: "$medicines" },
        {
            $group: {
                _id: "$medicines.medicineName",
                totalStock: { $sum: "$medicines.quantity" }
            }
        },
        { $sort: { totalStock: -1 } },
        { $limit: 5 },
        {
            $project: {
                medicine: "$_id",
                stock: "$totalStock",
                _id: 0
            }
        }
    ];

    return await Inventory.aggregate(pipeline);
};

// Helper function for low stock items
const getLowStockItems = async () => {
    const pipeline = [
        { $match: { isDraft: false } },
        { $unwind: "$medicines" },
        {
            $group: {
                _id: "$medicines.medicineName",
                totalQuantity: { $sum: "$medicines.quantity" },
                minReorderLevel: { $min: "$medicines.reorderLevel" },
                batches: {
                    $push: {
                        batchNumber: "$batchNumber",
                        quantity: "$medicines.quantity"
                    }
                }
            }
        },
        {
            $match: {
                $expr: { $lte: ["$totalQuantity", "$minReorderLevel"] }
            }
        },
        { $limit: 5 },
        {
            $project: {
                name: "$_id",
                batch: { $arrayElemAt: ["$batches.batchNumber", 0] },
                current: "$totalQuantity",
                required: "$minReorderLevel"
            }
        }
    ];

    const results = await Inventory.aggregate(pipeline);
    
    return results.map((item, index) => ({
        id: index + 1,
        ...item
    }));
};

const getExpiringSoonItems = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    
    const pipeline: PipelineStage[] = [
        { $match: { isDraft: false } },
        { $unwind: "$medicines" },
        {
            $match: {
                $and: [
                    { "medicines.expiryDate": { $gte: todayStart } }, // >= today (includes today)
                    { "medicines.expiryDate": { $lte: tenDaysFromNow } } // <= 10 days from now
                ]
            }
        },
        { $sort: { "medicines.expiryDate": 1 } },
        { $limit: 5 },
        {
            $project: {
                name: "$medicines.medicineName",
                batch: "$batchNumber",
                quantity: "$medicines.quantity",
                expiry: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$medicines.expiryDate"
                    }
                },
                daysLeft: {
                    $floor: { // Use floor to get whole days
                        $divide: [
                            { $subtract: ["$medicines.expiryDate", todayStart] },
                            86400000
                        ]
                    }
                }
            }
        }
    ];
    
    const results = await Inventory.aggregate(pipeline);
    
    return results.map((item: any, index: number) => ({
        id: index + 1,
        ...item
    }));
};

// NEW: Helper function for already expired items
const getAlreadyExpiredItems = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const pipeline: PipelineStage[] = [
        { $match: { isDraft: false } },
        { $unwind: "$medicines" },
        {
            $match: {
                "medicines.expiryDate": { $lt: todayStart } // < today (excludes today)
            }
        },
        { $sort: { "medicines.expiryDate": -1 } }, // Most recently expired first
        { $limit: 5 },
        {
            $project: {
                name: "$medicines.medicineName",
                batch: "$batchNumber",
                expiry: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$medicines.expiryDate"
                    }
                },
                quantity: "$medicines.quantity",
                daysExpired: {
                    $floor: { // Use floor to get whole days
                        $divide: [
                            { $subtract: [todayStart, "$medicines.expiryDate"] },
                            86400000 // milliseconds in a day
                        ]
                    }
                }
            }
        }
    ];
    
    const results = await Inventory.aggregate(pipeline);
    
    return results.map((item: any, index: number) => ({
        id: index + 1,
        ...item
    }));
};



export const getExpireSoonItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
        
        const pipeline: PipelineStage[] = [
            { $match: { isDraft: false } },
            { $unwind: "$medicines" },
            {
                $match: {
                    $and: [
                        { "medicines.expiryDate": { $gte: todayStart } }, // >= today (includes today)
                        { "medicines.expiryDate": { $lte: tenDaysFromNow } } // <= 10 days from now
                    ]
                }
            },
            {
                $group: {
                    _id: "$medicines.medicineName",
                    totalQuantity: { $sum: "$medicines.quantity" },
                    batches: {
                        $push: {
                            batchNumber: "$batchNumber",
                            quantity: "$medicines.quantity",
                            expiryDate: "$medicines.expiryDate",
                            price: "$medicines.price"
                        }
                    },
                    earliestExpiry: { $min: "$medicines.expiryDate" }
                }
            },
            { $sort: { earliestExpiry: 1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
                $project: {
                    name: "$_id",
                    totalQuantity: 1,
                    batches: 1,
                    earliestExpiry: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$earliestExpiry"
                        }
                    },
                    daysLeft: {
                        $floor: { // Use floor to get whole days
                            $divide: [
                                { $subtract: ["$earliestExpiry", todayStart] },
                                86400000
                            ]
                        }
                    }
                }
            }
        ];
        
        // Get total count for pagination
        const countPipeline = [
            { $match: { isDraft: false } },
            { $unwind: "$medicines" },
            {
                $match: {
                    $and: [
                        { "medicines.expiryDate": { $gte: todayStart } }, // >= today (includes today)
                        { "medicines.expiryDate": { $lte: tenDaysFromNow } } // <= 10 days from now
                    ]
                }
            },
            {
                $group: {
                    _id: "$medicines.medicineName"
                }
            },
            { $count: "total" }
        ];
        
        const totalCount = (await Inventory.aggregate(countPipeline))[0]?.total || 0;
        const results = await Inventory.aggregate(pipeline);
        
        res.status(200).json({
            success: true,
            data: {
                items: results,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalItems: totalCount,
                    itemsPerPage: limitNum
                }
            }
        });

    } catch (error: any) {
        console.error("Error in getExpireSoonItems:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const getLowStockItemsEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;
        
        const pipeline: PipelineStage[] = [
            { $match: { isDraft: false } },
            { $unwind: "$medicines" },
            {
                $group: {
                    _id: "$medicines.medicineName",
                    totalQuantity: { $sum: "$medicines.quantity" },
                    minReorderLevel: { $min: "$medicines.reorderLevel" },
                    batches: {
                        $push: {
                            batchNumber: "$batchNumber",
                            quantity: "$medicines.quantity",
                            expiryDate: "$medicines.expiryDate",
                            price: "$medicines.price"
                        }
                    }
                }
            },
            {
                $match: {
                    $expr: { $lte: ["$totalQuantity", "$minReorderLevel"] }
                }
            },
            { $sort: { totalQuantity: 1 } }, // Show items with lowest stock first
            { $skip: skip },
            { $limit: limitNum },
            {
                $project: {
                    name: "$_id",
                    currentStock: "$totalQuantity",
                    reorderLevel: "$minReorderLevel",
                    shortage: { $subtract: ["$minReorderLevel", "$totalQuantity"] },
                    batches: 1
                }
            }
        ];
        
        // Get total count for pagination
        const countPipeline = pipeline.slice(0, -4); // Remove sort, skip, limit, and project
        const totalCount = (await Inventory.aggregate([...countPipeline, { $count: "total" }]))[0]?.total || 0;
        
        const results = await Inventory.aggregate(pipeline);
        
        res.status(200).json({
            success: true,
            data: {
                items: results,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalItems: totalCount,
                    itemsPerPage: limitNum
                }
            }
        });

    } catch (error: any) {
        console.error("Error in getLowStockItemsEndpoint:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};