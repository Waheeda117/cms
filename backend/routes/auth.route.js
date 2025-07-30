import express from "express";
import {
	login,
	logout,
	signup,
	resetPassword,
	checkAuth,
	updatePassword
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/roleAuth.js";

const router = express.Router();


router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/update-password", verifyToken, updatePassword);
router.post("/reset-password", verifyToken, authorizeRoles("admin"), resetPassword);

export default router;
