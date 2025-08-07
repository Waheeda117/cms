import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { 
    addToStock, 
    addDraftBatch, // New function
    finalizeDraftBatch, // New function
    stockList, 
    allStocksList, 
    deleteStockById, 
    updateBatchById,
    getBatchById,
    getStockById,
    getDashboardStats
} from "../controllers/inventory.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Route for adding finalized batch (existing)
router.post("/add-batch", authorizeRoles("admin", "pharmacist_inventory"), addToStock); 

// NEW: Route for adding draft batch
router.post("/add-draft-batch", authorizeRoles("admin", "pharmacist_inventory"), addDraftBatch);

// NEW: Route for finalizing draft batch
router.put("/finalize-batch/:id", authorizeRoles("admin", "pharmacist_inventory"), finalizeDraftBatch);

// Common routes (handle both draft and finalized)
router.get("/batches", authorizeRoles("admin", "pharmacist_inventory"), stockList); 
router.get("/all-medicines", authorizeRoles("admin", "pharmacist_inventory"), allStocksList);
router.get("/batch/:id", authorizeRoles("admin", "pharmacist_inventory"), getBatchById);
router.get("/stock/:medicineName", authorizeRoles("admin", "pharmacist_inventory"), getStockById);
router.delete("/batch/:id", authorizeRoles("admin", "pharmacist_inventory"), deleteStockById);
router.put("/batch/:id", authorizeRoles("admin", "pharmacist_inventory"), updateBatchById);

router.get("/dashboard-stats", authorizeRoles("admin", "pharmacist_inventory"), getDashboardStats);

export default router; 