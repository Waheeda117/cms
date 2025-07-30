
import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { User } from "../models/user.model.js";

// Helper function to generate unique username
const generateUniqueUsername = async (firstName, lastName) => {
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

export const signup = async (req, res) => {
	const { email, password, firstName, lastName, role, cnic } = req.body;

	try {
		if (!password || !firstName || !lastName) {
			throw new Error("Password, first name, and last name are required");
		}

		// Only allow admin role for signup
		const validRoles = ["admin"];
		if (role && !validRoles.includes(role)) {
			return res.status(400).json({ 
				success: false, 
				message: "Only admin role can be created through signup" 
			});
		}

		// Validate CNIC format if provided
		if (cnic) {
			const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
			if (!cnicRegex.test(cnic)) {
				return res.status(400).json({ 
					success: false, 
					message: "CNIC must be in format: 12345-1234567-1" 
				});
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
		generateTokenAndSetCookie(res, user._id);

		// await sendVerificationEmail(user.email, verificationToken);

		res.status(201).json({
			success: true,
			message: "Admin user created successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

export const login = async (req, res) => {
	const { username, password } = req.body; // Changed from email to username
	try {
		if (!username || !password) {
			return res.status(400).json({ success: false, message: "Username and password are required" });
		}

		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}
		
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

		generateTokenAndSetCookie(res, user._id);

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};


export const logout = async (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};


// Update password
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate that both current and new passwords are provided
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both current and new passwords are required"
            });
        }

        // Find the user by the ID from the JWT token (req.userId)
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if the current password is correct
        const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
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
export const resetPassword = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Validate that userId is provided
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find the user to reset password for
        const userToReset = await User.findById(userId);

        if (!userToReset) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent admin from resetting another admin's password
        if (userToReset.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Cannot reset password for admin users"
            });
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