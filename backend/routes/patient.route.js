import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { 
    patientRegistration,
    getAllPatients,
    getPatientById,
    updatePatientById,
    deletePatientById
} from "../controllers/patient.controller.js";

const router = express.Router();

// Apply authentication and receptionist role authorization to all routes
router.use(verifyToken);
router.use(authorizeRoles("receptionist"));

// Patient CRUD routes
router.post("/register", patientRegistration);
router.get("/list", getAllPatients);
router.get("/:id", getPatientById);
router.patch("/:id", updatePatientById);
router.delete("/:id", deletePatientById);

export default router;