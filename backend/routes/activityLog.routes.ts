import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import {
  getBatchActivityLogs,
  getBatchActivityLogsByNumber,
  getAllActivityLogs
} from "../controllers/activityLog.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Get activity logs for a specific batch by ID
router.get(
  "/batch/:batchId", 
  authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), 
  getBatchActivityLogs
);

// Get activity logs for a specific batch by batch number
router.get(
  "/batch-number/:batchNumber", 
  authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), 
  getBatchActivityLogsByNumber
);

// Get all activity logs with filtering
router.get(
  "/", 
  authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), 
  getAllActivityLogs
);

export default router;