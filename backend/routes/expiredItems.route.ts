import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { 
    getAllExpiredMedicines,
    discardExpiredMedicine,
    getDiscardHistory,
    discardExpiredMedicineFromAllBatches
} from "../controllers/expiredItems.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Routes for expired medicines management
router.get("/expired-medicines", authorizeRoles("admin", "pharmacist_inventory"), getAllExpiredMedicines);
// router.post("/discard-expired", authorizeRoles("admin", "pharmacist_inventory"), discardExpiredMedicine);
router.post("/discard-medicine-all-batches", authorizeRoles("admin", "pharmacist_inventory"), discardExpiredMedicineFromAllBatches);
router.get("/discard-history", authorizeRoles("admin", "pharmacist_inventory"), getDiscardHistory);

export default router;