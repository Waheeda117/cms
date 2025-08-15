import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";
import { 
    getAllUsersData,
    registerDoctorFromAdmin, 
    registerReceptionistFromAdmin, 
    registerPharmacistDispenserFromAdmin, 
    registerPharmacistInventoryFromAdmin,
    registerPharmacistInventoryStaffFromAdmin,
    getUserDataByRoleAndId,
    updateUserDataByRoleAndId,
    deleteUserDataByRoleAndId
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply authentication and admin role authorization to all routes
router.use(verifyToken);
router.use(authorizeRoles("admin"));

router.get("/get-users-data", getAllUsersData);
router.post("/register/doctor", registerDoctorFromAdmin);
router.post("/register/receptionist", registerReceptionistFromAdmin);
router.post("/register/pharmacist-dispenser", registerPharmacistDispenserFromAdmin);
router.post("/register/pharmacist-inventory", registerPharmacistInventoryFromAdmin);
router.post("/register/pharmacist-inventory-staff", registerPharmacistInventoryStaffFromAdmin);

router.get("/:role/:id", getUserDataByRoleAndId);
router.patch("/:role/:id", updateUserDataByRoleAndId);
router.delete("/:role/:id", deleteUserDataByRoleAndId);

export default router;