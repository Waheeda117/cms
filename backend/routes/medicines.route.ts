import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import {
  getMedicines,
  createMedicine,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getMedicinesDropdown,
  createBulkMedicines
} from "../controllers/medicines.controller.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Get medicines for dropdown (minimal data for forms)
router.get("/dropdown", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff", "pharmacist_dispenser"), getMedicinesDropdown);

// Get all medicines with pagination and search
router.get("/", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), getMedicines);

// Create new medicine
router.post("/", authorizeRoles("admin", "pharmacist_inventory"), createMedicine);
router.post('/bulk', authorizeRoles("admin", "pharmacist_inventory"), createBulkMedicines);


// Get single medicine by medicineId
router.get("/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), getMedicineById);

// Update medicine
router.put("/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), updateMedicine);

// Delete medicine (soft delete)
router.delete("/:id", authorizeRoles("admin", "pharmacist_inventory", "pharmacist_inventory_staff"), deleteMedicine);

export default router;