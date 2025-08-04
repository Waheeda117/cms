import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { 
    addToStock, 
    stockList, 
    allStocksList, 
    deleteStockById, 
    updateBatchById,
    getBatchById,
    getStockById
} from "../controllers/inventory.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Route that both admin and pharmacist_inventory can access
router.post("/add-batch", authorizeRoles("admin", "pharmacist_inventory"), addToStock); 
router.get("/batches", authorizeRoles("admin", "pharmacist_inventory"), stockList); 
router.get("/all-medicines", authorizeRoles("admin", "pharmacist_inventory"), allStocksList);

// Route for getting batch by ID (both admin and pharmacist_inventory can access)
router.get("/batch/:id", authorizeRoles("admin", "pharmacist_inventory"), getBatchById);

router.get("/stock/:medicineName", authorizeRoles("admin", "pharmacist_inventory"), getStockById);


// Routes that only admin can access
router.delete("/batch/:id", authorizeRoles("admin", "pharmacist_inventory"), deleteStockById);
// Route for updating batch by ID (only admin can access)
router.put("/batch/:id", authorizeRoles("admin", "pharmacist_inventory"), updateBatchById);




export default router;