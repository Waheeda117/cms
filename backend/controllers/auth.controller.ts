import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { User, IUser } from "../models/user.model.js";
import { AuthenticatedRequest, ILoginRequest, IRegisterRequest, IChangePasswordRequest, IResetPasswordRequest } from "../types/index.js";

// Helper function to generate unique username
const generateUniqueUsername = async (firstName: string, lastName: string): Promise<string> => {
	const baseUsername = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`;
	
	// Check if base username exists
	let username = baseUsername;
	let counter = 1;
	
	while (await User.findOne({ username })) {
		username = `${baseUsername}${counter}`;
		counter++;
	}
	
	return username;
};

export const signup = async (req: Request<{}, {}, IRegisterRequest>, res: Response): Promise<void> => {
	const { email, password, firstName, lastName, role, cnic } = req.body;

	try {
		if (!password || !firstName || !lastName) {
			throw new Error("Password, first name, and last name are required");
		}

		// Only allow admin role for signup
		const validRoles = ["admin"];
		if (role && !validRoles.includes(role)) {
			res.status(400).json({ 
				success: false, 
				message: "Only admin role can be created through signup" 
			});
			return;
		}

		// Validate CNIC format if provided
		if (cnic) {
			const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
			if (!cnicRegex.test(cnic)) {
				res.status(400).json({ 
					success: false, 
					message: "CNIC must be in format: 12345-1234567-1" 
				});
				return;
			}
		}

		// Generate unique username
		const username = await generateUniqueUsername(firstName, lastName);

		const hashedPassword = await bcryptjs.hash(password, 10);
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

		const user = new User({
			email: email || undefined, // Don't set null, let it be undefined
			password: hashedPassword,
			firstName,
			lastName,
			username,
			cnic: cnic || undefined, // Don't set null, let it be undefined
			role: "admin", // Always admin for signup
			verificationToken,
			verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
		});

		await user.save();

		// jwt
		generateTokenAndSetCookie(res, user._id.toString());

		// await sendVerificationEmail(user.email, verificationToken);

		res.status(201).json({
			success: true,
			message: "Admin user created successfully",
			user: {
				...user.toObject(),
				password: undefined,
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		res.status(400).json({ success: false, message: errorMessage });
	}
};

export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
	const { username, password } = req.body; // Changed from email to username
	try {
		if (!username || !password) {
			res.status(400).json({ success: false, message: "Username and password are required" });
			return;
		}

		const user = await User.findOne({ username });
		if (!user) {
			res.status(400).json({ success: false, message: "Invalid credentials" });
			return;
		}
		
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			res.status(400).json({ success: false, message: "Invalid credentials" });
			return;
		}

		generateTokenAndSetCookie(res, user._id.toString());

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user.toObject(),
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		res.status(400).json({ success: false, message: errorMessage });
	}
};

export const logout = async (req: Request, res: Response): Promise<void> => {
	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const checkAuth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		const user = await User.findById((req as any).userId).select("-password");
		if (!user) {
			res.status(400).json({ success: false, message: "User not found" });
			return;
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		res.status(400).json({ success: false, message: errorMessage });
	}
};

// Update password
export const updatePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate that both current and new passwords are provided
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Both current and new passwords are required"
            });
            return;
        }

        // Find the user by the ID from the JWT token (req.userId)
        const user = await User.findById((req as any).userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Check if the current password is correct
        const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
            return;
        }

        // Hash the new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        // Update the password and set isDefaultPassword to false
        user.password = hashedPassword;
        if (user.role !== "admin") {
            user.isDefaultPassword = false;
        }
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.log("Error in updatePassword ", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating password"
        });
    }
};

// Reset password (admin only)
export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;
        
        // Validate that userId is provided
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "User ID is required"
            });
            return;
        }

        // Find the user to reset password for
        const userToReset = await User.findById(userId);

        if (!userToReset) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Prevent admin from resetting another admin's password
        if (userToReset.role === "admin") {
            res.status(403).json({
                success: false,
                message: "Cannot reset password for admin users"
            });
            return;
        }

        // Set default password "abc12345"
        const defaultPassword = "abc12345";
        const hashedPassword = await bcryptjs.hash(defaultPassword, 10);

        // Update user's password and set isDefaultPassword to true
        userToReset.password = hashedPassword;
        userToReset.isDefaultPassword = true;
        await userToReset.save();

        res.status(200).json({
            success: true,
            message: `Password reset successfully for user ${userToReset.username}. Default password: ${defaultPassword}`
        });
    } catch (error) {
        console.log("Error in resetPassword ", error);
        res.status(500).json({
            success: false,
            message: "Server error while resetting password"
        });
    }
}; 