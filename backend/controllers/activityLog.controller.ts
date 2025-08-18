import { Request, Response } from "express";
import { ActivityLogService } from "../services/activityLog.service.js";
import { AuthenticatedRequest } from "../types/index.js";
import mongoose from "mongoose";

/**
 * Get activity logs for a specific batch by ID
 */
export const getBatchActivityLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
      res.status(400).json({
        success: false,
        message: "Valid batch ID is required"
      });
      return;
    }

    const result = await ActivityLogService.getBatchActivityLogs(
      new mongoose.Types.ObjectId(batchId),
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: result
    });

  } catch (error: any) {
    console.error("Error in getBatchActivityLogs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get activity logs for a specific batch by batch number
 */
export const getBatchActivityLogsByNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { batchNumber } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!batchNumber) {
      res.status(400).json({
        success: false,
        message: "Batch number is required"
      });
      return;
    }

    const decodedBatchNumber = decodeURIComponent(batchNumber);
    
    const result = await ActivityLogService.getBatchActivityLogsByNumber(
      decodedBatchNumber,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: result
    });

  } catch (error: any) {
    console.error("Error in getBatchActivityLogsByNumber:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get all activity logs with filtering options
 */
export const getAllActivityLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 50,
      batchNumber,
      action,
      owner,
      startDate,
      endDate
    } = req.query;

    // Build filter query
    const filter: any = {};

    if (batchNumber) {
      filter.batchNumber = { $regex: batchNumber, $options: 'i' };
    }

    if (action) {
      filter.action = action;
    }

    if (owner && mongoose.Types.ObjectId.isValid(owner as string)) {
      filter.owner = new mongoose.Types.ObjectId(owner as string);
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, totalCount] = await Promise.all([
      mongoose.model('ActivityLog').find(filter)
        .populate('owner', 'name email username')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      mongoose.model('ActivityLog').countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit as string));

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit as string),
          hasNextPage: parseInt(page as string) < totalPages,
          hasPrevPage: parseInt(page as string) > 1
        },
        filters: {
          batchNumber,
          action,
          owner,
          startDate,
          endDate
        }
      }
    });

  } catch (error: any) {
    console.error("Error in getAllActivityLogs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};