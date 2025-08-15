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
    getDashboardStats,
    getExpireSoonItems,
    getLowStockItemsEndpoint
} from "../controllers/inventory.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Route for adding finalized batch (existing)
router.post("/add-batch", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), addToStock); 

// NEW: Route for adding draft batch
router.post("/add-draft-batch", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), addDraftBatch);

// NEW: Route for finalizing draft batch
router.put("/finalize-batch/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), finalizeDraftBatch);

// Common routes (handle both draft and finalized)
router.get("/batches", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), stockList); 
router.get("/all-medicines", authorizeRoles("admin", "pharmacist_inventory"), allStocksList);
router.get("/batch/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), getBatchById);
router.get("/stock/:medicineName", authorizeRoles("admin", "pharmacist_inventory"), getStockById);
router.delete("/batch/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), deleteStockById);
router.put("/batch/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), updateBatchById);

router.get("/dashboard-stats", authorizeRoles("admin", "pharmacist_inventory"), getDashboardStats);

router.get("/expire-soon-items", authorizeRoles("admin", "pharmacist_inventory"), getExpireSoonItems);
router.get("/low-stock-items", authorizeRoles("admin", "pharmacist_inventory"), getLowStockItemsEndpoint);

export default router; 