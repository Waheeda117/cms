import { Inventory } from "../models/inventory.model.js";
import mongoose from "mongoose";

export const addToStock = async (req, res) => {
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
            return res.status(400).json({
                success: false,
                message: "All fields are required. Medicines must be a non-empty array."
            });
        }

        // Validate miscellaneous amount
        if (miscellaneousAmount < 0) {
            return res.status(400).json({
                success: false,
                message: "Miscellaneous amount cannot be negative"
            });
        }

        // Check for duplicate medicine IDs within the same batch
        const medicineIds = medicines.map(med => med.medicineId).filter(id => id !== null);
        const uniqueMedicineIds = [...new Set(medicineIds)];
        
        if (medicineIds.length !== uniqueMedicineIds.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate medicines are not allowed in the same batch"
            });
        }

        // Validate each medicine in the array
        for (const medicine of medicines) {
            const { medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
            
            if (!medicineId || !medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "All medicine fields are required: medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel"
                });
            }

            if (quantity <= 0 || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity and price must be greater than 0"
                });
            }

            // Calculate total amount for each medicine
            medicine.totalAmount = quantity * price;
        }

        // Calculate total medicines price
        const totalMedicinesPrice = medicines.reduce((sum, medicine) => sum + medicine.totalAmount, 0);
        
        // Validate price matching with miscellaneous amount
        const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
        const priceDifference = Math.abs(totalWithMiscellaneous - overallPrice);
        
        if (priceDifference > 0.01) { // Allow small floating point tolerance
            return res.status(400).json({
                success: false,
                message: `Total medicines price (${totalMedicinesPrice}) plus miscellaneous amount (${miscellaneousAmount}) must equal overall price (${overallPrice})`
            });
        }

        // Check if batch already exists
        const existingBatch = await Inventory.findOne({ batchNumber });

        if (existingBatch) {
            return res.status(400).json({
                success: false,
                message: "Batch number already exists. Please use a different batch number."
            });
        }

        // Create new batch
        const newBatch = new Inventory({
            batchNumber,
            billID,
            medicines,
            overallPrice,
            miscellaneousAmount,
            attachments,
            createdBy: req.user.id
        });

        await newBatch.save();

        return res.status(201).json({
            success: true,
            message: `New batch created successfully with ${medicines.length} medicines${miscellaneousAmount > 0 ? ' and miscellaneous amount' : ''}`,
            data: newBatch
        });

    } catch (error) {
        console.error("Error in addToStock:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Batch number already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const stockList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        // Build search query
        const searchQuery = {};

        // Text search across batch number, bill ID, or medicine names
        if (search) {
            searchQuery.$or = [
                { batchNumber: { $regex: search, $options: "i" } },
                { billID: { $regex: search, $options: "i" } },
                { "medicines.medicineName": { $regex: search, $options: "i" } }
            ];
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const [batches, totalCount] = await Promise.all([
            Inventory.find(searchQuery)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'name email')
                .lean(),
            Inventory.countDocuments(searchQuery)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        // Add status and additional info to each batch
        const enrichedBatches = batches.map(batch => {
            const totalMedicines = batch.medicines.length;
            const totalQuantity = batch.medicines.reduce((sum, med) => sum + med.quantity, 0);
            const totalMedicinesPrice = batch.medicines.reduce((sum, med) => sum + med.totalAmount, 0);
            const lowStockMedicines = batch.medicines.filter(med => med.quantity <= med.reorderLevel).length;
            const expiredMedicines = batch.medicines.filter(med => new Date(med.expiryDate) < new Date()).length;

            return {
                ...batch,
                summary: {
                    totalMedicines,
                    totalQuantity,
                    totalMedicinesPrice,
                    miscellaneousAmount: batch.miscellaneousAmount || 0,
                    lowStockMedicines,
                    expiredMedicines,
                    batchStatus: lowStockMedicines > 0 ? "Has Low Stock" : expiredMedicines > 0 ? "Has Expired Items" : "Good"
                }
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                batches: enrichedBatches,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalBatches: totalCount,
                    totalMedicines: enrichedBatches.reduce((sum, batch) => sum + batch.summary.totalMedicines, 0),
                    totalMiscellaneousAmount: enrichedBatches.reduce((sum, batch) => sum + batch.summary.miscellaneousAmount, 0),
                    batchesWithLowStock: enrichedBatches.filter(batch => batch.summary.lowStockMedicines > 0).length,
                    batchesWithExpiredItems: enrichedBatches.filter(batch => batch.summary.expiredMedicines > 0).length
                }
            }
        });

    } catch (error) {
        console.error("Error in stockList:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const allStocksList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            sortBy = "medicineName",
            sortOrder = "asc"
        } = req.query;

        // Build aggregation pipeline to flatten medicines across all batches
        const pipeline = [];

        // Unwind medicines array to treat each medicine as a separate document
        pipeline.push({ $unwind: "$medicines" });

        // Match stage for filtering
        const matchStage = {};
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
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
        pipeline.push({ $sort: sortObj });

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Execute aggregation
        const medicines = await Inventory.aggregate(pipeline);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        // Calculate summary statistics
        const lowStockCount = medicines.filter(item => item.status === "Low Stock").length;
        const totalBatches = medicines.reduce((sum, item) => sum + item.batchCount, 0);
        const totalInventoryValue = medicines.reduce((sum, item) => sum + item.totalValue, 0);
        
        // Count medicines with expired batches
        const expiredMedicinesCount = medicines.filter(item => item.hasExpiredBatches).length;
        
        // Count medicines with expiring batches (within 10 days, but not expired yet)
        const expiringMedicinesCount = medicines.filter(item => item.hasExpiringBatches).length;

        return res.status(200).json({
            success: true,
            data: {
                medicines,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
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

    } catch (error) {
        console.error("Error in allStocksList:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const getStockById = async (req, res) => {
    try {
        const { medicineName } = req.params;
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        if (!medicineName) {
            return res.status(400).json({
                success: false,
                message: "Medicine name is required"
            });
        }

        // Decode the medicine name in case it's URL encoded
        const decodedMedicineName = decodeURIComponent(medicineName);

        // Build aggregation pipeline
        const pipeline = [];

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
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
        pipeline.push({ $sort: sortObj });

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        if (totalCount === 0) {
            return res.status(404).json({
                success: false,
                message: `No stock found for medicine: ${decodedMedicineName}`
            });
        }

        // Add pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

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
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        return res.status(200).json({
            success: true,
            data: {
                medicineName: decodedMedicineName,
                stockEntries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
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

    } catch (error) {
        console.error("Error in getStockById:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteStockById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
        }

        // Find and delete the batch
        const deletedBatch = await Inventory.findByIdAndDelete(id);

        if (!deletedBatch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Batch deleted successfully`,
            data: {
                deletedBatch: {
                    id: deletedBatch._id,
                    batchNumber: deletedBatch.batchNumber,
                    billID: deletedBatch.billID,
                    medicineCount: deletedBatch.medicines.length,
                    overallPrice: deletedBatch.overallPrice
                }
            }
        });

    } catch (error) {
        console.error("Error in deleteStockById:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const updateBatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
        }

        // Check if batch exists
        const existingBatch = await Inventory.findById(id);
        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        // If batchNumber is being updated, check for uniqueness
        if (updateData.batchNumber && updateData.batchNumber !== existingBatch.batchNumber) {
            const batchExists = await Inventory.findOne({ 
                batchNumber: updateData.batchNumber,
                _id: { $ne: id } // Exclude current batch
            });
            
            if (batchExists) {
                return res.status(400).json({
                    success: false,
                    message: "Batch number already exists. Please use a different batch number."
                });
            }
        }

        // Validate medicines array if provided
        if (updateData.medicines) {
            if (!Array.isArray(updateData.medicines)) {
                return res.status(400).json({
                    success: false,
                    message: "Medicines must be an array"
                });
            }

            // Check for duplicate medicine IDs within the batch
            const medicineIds = updateData.medicines.map(med => med.medicineId).filter(id => id !== null && id !== undefined);
            const uniqueMedicineIds = [...new Set(medicineIds)];
            
            if (medicineIds.length !== uniqueMedicineIds.length) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate medicines are not allowed in the same batch. Each medicine can only be added once."
                });
            }

            // Validate each medicine in the array
            for (const medicine of updateData.medicines) {
                const { medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
                
                // Validate required fields including medicineId
                if (!medicineId || !medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: "All medicine fields are required: medicineId, medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel"
                    });
                }

                // Validate medicineId is a positive number
                if (!Number.isInteger(medicineId) || medicineId <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Medicine ID must be a positive integer"
                    });
                }

                if (quantity <= 0 || price <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Quantity and price must be greater than 0"
                    });
                }

                // Validate quantity and price are numbers
                if (!Number.isInteger(quantity) || isNaN(parseFloat(price))) {
                    return res.status(400).json({
                        success: false,
                        message: "Quantity must be an integer and price must be a valid number"
                    });
                }

                // Validate dates
                if (isNaN(Date.parse(expiryDate)) || isNaN(Date.parse(dateOfPurchase))) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid date format for expiryDate or dateOfPurchase"
                    });
                }

                // Validate reorderLevel
                if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Reorder level must be a non-negative integer"
                    });
                }

                // Calculate total amount for each medicine
                medicine.totalAmount = quantity * price;
            }
        }

        // Validate miscellaneous amount if provided
        if (updateData.miscellaneousAmount !== undefined) {
            if (isNaN(parseFloat(updateData.miscellaneousAmount)) || updateData.miscellaneousAmount < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Miscellaneous amount must be a non-negative number"
                });
            }
        }

        // Validate other numeric fields if provided
        if (updateData.overallPrice !== undefined) {
            if (isNaN(parseFloat(updateData.overallPrice)) || updateData.overallPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Overall price must be a non-negative number"
                });
            }
        }

        // If both medicines and overallPrice are being updated, validate total
        if (updateData.medicines && updateData.overallPrice !== undefined) {
            const totalMedicinesPrice = updateData.medicines.reduce((sum, medicine) => sum + medicine.totalAmount, 0);
            const miscellaneousAmount = updateData.miscellaneousAmount !== undefined ? updateData.miscellaneousAmount : (existingBatch.miscellaneousAmount || 0);
            const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
            const priceDifference = Math.abs(totalWithMiscellaneous - updateData.overallPrice);
            
            if (priceDifference > 0.01) { // Allow small floating point tolerance
                return res.status(400).json({
                    success: false,
                    message: `Total medicines price (${totalMedicinesPrice.toFixed(2)}) plus miscellaneous amount (${miscellaneousAmount.toFixed(2)}) must equal overall price (${parseFloat(updateData.overallPrice).toFixed(2)}). Current difference: ${priceDifference.toFixed(2)}`
                });
            }
        }

        // If only medicines are being updated but overallPrice exists, validate against existing overallPrice
        if (updateData.medicines && updateData.overallPrice === undefined && existingBatch.overallPrice) {
            const totalMedicinesPrice = updateData.medicines.reduce((sum, medicine) => sum + medicine.totalAmount, 0);
            const miscellaneousAmount = updateData.miscellaneousAmount !== undefined ? updateData.miscellaneousAmount : (existingBatch.miscellaneousAmount || 0);
            const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
            const priceDifference = Math.abs(totalWithMiscellaneous - existingBatch.overallPrice);
            
            if (priceDifference > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: `Total medicines price (${totalMedicinesPrice.toFixed(2)}) plus miscellaneous amount (${miscellaneousAmount.toFixed(2)}) must equal existing overall price (${existingBatch.overallPrice.toFixed(2)}). Current difference: ${priceDifference.toFixed(2)}`
                });
            }
        }

        // Validate attachments array if provided
        if (updateData.attachments !== undefined) {
            if (!Array.isArray(updateData.attachments)) {
                return res.status(400).json({
                    success: false,
                    message: "Attachments must be an array"
                });
            }

            // Validate each attachment URL
            for (const attachment of updateData.attachments) {
                if (typeof attachment !== 'string' || attachment.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: "Each attachment must be a valid URL string"
                    });
                }
            }
        }

        // Update the batch with partial data
        const updatedBatch = await Inventory.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, // Return updated document
                runValidators: true // Run schema validators
            }
        ).populate('createdBy', 'name email');

        // Prepare response with summary information
        const totalMedicines = updatedBatch.medicines.length;
        const totalQuantity = updatedBatch.medicines.reduce((sum, med) => sum + med.quantity, 0);
        const totalMedicinesPrice = updatedBatch.medicines.reduce((sum, med) => sum + med.totalAmount, 0);
        const lowStockMedicines = updatedBatch.medicines.filter(med => med.quantity <= med.reorderLevel).length;
        const expiredMedicines = updatedBatch.medicines.filter(med => new Date(med.expiryDate) < new Date()).length;

        return res.status(200).json({
            success: true,
            message: "Batch updated successfully",
            data: {
                ...updatedBatch.toObject(),
                summary: {
                    totalMedicines,
                    totalQuantity,
                    totalMedicinesPrice,
                    miscellaneousAmount: updatedBatch.miscellaneousAmount || 0,
                    lowStockMedicines,
                    expiredMedicines,
                    batchStatus: lowStockMedicines > 0 ? "Has Low Stock" : expiredMedicines > 0 ? "Has Expired Items" : "Good"
                }
            }
        });

    } catch (error) {
        console.error("Error in updateBatchById:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
        }

        if (error.code === 11000) {
            // Handle duplicate key errors
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${duplicateField} already exists. Please use a different value.`
            });
        }

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

// Get batch by ID
export const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
        }

        // Find the batch by ID
        const batch = await Inventory.findById(id).populate('createdBy', 'name email username');
        
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Batch retrieved successfully",
            data: batch
        });

    } catch (error) {
        console.error("Error in getBatchById:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};