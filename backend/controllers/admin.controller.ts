import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { User, IUser } from "../models/user.model.js";
import { AuthenticatedRequest } from "../types/index.js";

// Helper function to generate unique username
const generateUniqueUsername = async (firstName: string, lastName: string): Promise<string> => {
  const baseUsername = firstName.charAt(0).toLowerCase() + lastName.toLowerCase();
  let username = baseUsername;
  let counter = 1;

  // Check if username exists and increment counter if needed
  while (await User.findOne({ username })) {
    username = baseUsername + counter;
    counter++;
  }

  return username;
};

interface DoctorRegistrationData {
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  cnic?: string;
  phoneNumber: string;
  address: string;
  gender: 'male' | 'female' | 'other';
  speciality: string;
  registrationNumber: string;
  doctorSchedule: string[];
}

interface UserRegistrationData {
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  cnic?: string;
  phoneNumber: string;
  address: string;
  gender: 'male' | 'female' | 'other';
}

export const registerDoctorFromAdmin = async (req: Request<{}, {}, DoctorRegistrationData>, res: Response): Promise<void> => {
    try {
        const { 
            email, 
            password, 
            firstName,
            lastName,
            cnic, 
            phoneNumber, 
            address, 
            gender,
            speciality,
            registrationNumber,
            doctorSchedule
        } = req.body;

        // Validate required fields for doctor
        if (!firstName || !lastName || !password || !phoneNumber || !address || !gender || !speciality || !registrationNumber || !doctorSchedule) {
            res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for doctor registration" 
            });
            return;
        }

        // Validate CNIC format if provided
        if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
            res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
            return;
        }

        // Generate unique username
        const username = await generateUniqueUsername(firstName, lastName);

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create doctor user
        const doctor = new User({
            email: email || undefined, // Don't set email to null, set it as undefined if not provided
            password: hashedPassword,
            firstName,
            lastName,
            username,
            cnic: cnic || undefined, // Don't set cnic to null, set it as undefined if not provided
            role: "doctor",
            phoneNumber,
            isDefaultPassword: true,
            address,
            gender,
            speciality,
            registrationNumber,
            doctorSchedule,
            isActive: true,
            isVerified: false
        });

        await doctor.save();

        res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            user: { ...doctor.toObject(), password: undefined }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ success: false, message: errorMessage });
    }
};

export const registerReceptionistFromAdmin = async (req: Request<{}, {}, UserRegistrationData>, res: Response): Promise<void> => {
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            cnic, 
            phoneNumber, 
            address, 
            gender 
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !password || !phoneNumber || !address || !gender) {
            res.status(400).json({
                success: false,
                message: "All required fields must be provided for receptionist registration"
            });
            return;
        }

        // CNIC validation (optional)
        if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
            res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
            return;
        }

        // Generate unique username
        const username = await generateUniqueUsername(firstName, lastName);

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create receptionist user
        const receptionist = new User({
            email: email || undefined, // Don't set email to null, set it as undefined if not provided
            password: hashedPassword,
            firstName,
            lastName,
            username,
            isDefaultPassword: true,
            cnic: cnic || undefined, // Don't set cnic to null, set it as undefined if not provided
            role: "receptionist",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await receptionist.save();

        res.status(201).json({
            success: true,
            message: "Receptionist registered successfully",
            user: { ...receptionist.toObject(), password: undefined }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ success: false, message: errorMessage });
    }
};

export const registerPharmacistDispenserFromAdmin = async (req: Request<{}, {}, UserRegistrationData>, res: Response): Promise<void> => {
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            cnic, 
            phoneNumber, 
            address, 
            gender 
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !password || !phoneNumber || !address || !gender) {
            res.status(400).json({
                success: false,
                message: "All required fields must be provided for pharmacist_dispenser registration"
            });
            return;
        }

        // CNIC validation (optional)
        if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
            res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
            return;
        }

        // Generate unique username
        const username = await generateUniqueUsername(firstName, lastName);

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create pharmacist_dispenser user
        const pharmacistDispenser = new User({
            email: email || undefined, // Don't set email to null, set it as undefined if not provided
            password: hashedPassword,
            firstName,
            lastName,
            username,
            isDefaultPassword: true,
            cnic: cnic || undefined, // Don't set cnic to null, set it as undefined if not provided
            role: "pharmacist_dispenser",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistDispenser.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist Dispenser registered successfully",
            user: { ...pharmacistDispenser.toObject(), password: undefined }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ success: false, message: errorMessage });
    }
};

export const registerPharmacistInventoryFromAdmin = async (req: Request<{}, {}, UserRegistrationData>, res: Response): Promise<void> => {
    try {
        const { 
            email, 
            password, 
            firstName, 
            lastName, 
            cnic, 
            phoneNumber, 
            address, 
            gender 
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !password || !phoneNumber || !address || !gender) {
            res.status(400).json({
                success: false,
                message: "All required fields must be provided for pharmacist_inventory registration"
            });
            return;
        }

        // CNIC validation (optional)
        if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
            res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
            return;
        }

        // Generate unique username
        const username = await generateUniqueUsername(firstName, lastName);

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create pharmacist_inventory user
        const pharmacistInventory = new User({
            email: email || undefined, // Don't set email to null, set it as undefined if not provided
            password: hashedPassword,
            firstName,
            lastName,
            username,
            isDefaultPassword: true,
            cnic: cnic || undefined, // Don't set cnic to null, set it as undefined if not provided
            role: "pharmacist_inventory",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistInventory.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist Inventory registered successfully",
            user: { ...pharmacistInventory.toObject(), password: undefined }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ success: false, message: errorMessage });
    }
};

export const getAllUsersData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Fetch all users, excluding passwords
        const users = await User.find({}, { password: 0 });

        if (!users || users.length === 0) {
            res.status(404).json({ success: false, message: "No users found" });
            return;
        }

        // Create summaries for each role
        const roleSummary: Record<string, number> = {
            admin: 0,
            doctor: 0,
            receptionist: 0,
            pharmacist_dispenser: 0,
            pharmacist_inventory: 0
        };

        // Populate the role counts
        users.forEach(user => {
            if (roleSummary[user.role] !== undefined) {
                roleSummary[user.role] = (roleSummary[user.role] || 0) + 1;
            }
        });

        // Prepare the response data
        const response = {
            success: true,
            message: "Users fetched successfully",
            roles: roleSummary, // Role counts
            users: users, // List of all users
            quickSummary: {
                totalUsers: users.length,
                roleCounts: roleSummary
            }
        };

        res.status(200).json(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ success: false, message: errorMessage });
    }
};

export const getUserDataByRoleAndId = async (req: Request<{ role: string; id: string }>, res: Response): Promise<void> => {
    try {
        const { role, id } = req.params;

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory"];
        if (!validRoles.includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role" });
            return;
        }

        // Find the user by role and ID
        const user = await User.findOne({ _id: id, role: role }).select("-password");  // Exclude password

        if (!user) {
            res.status(404).json({ success: false, message: `${role} not found` });
            return;
        }

        // Return the found user data
        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} data fetched successfully`,
            user: user,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ success: false, message: errorMessage });
    }
};

export const updateUserDataByRoleAndId = async (req: Request<{ role: string; id: string }, {}, any>, res: Response): Promise<void> => {
    try {
        const { role, id } = req.params;
        const updatedData = req.body;  // The new data sent in the request body

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory"];
        if (!validRoles.includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role" });
            return;
        }

        // Find the user by role and ID
        const user = await User.findOne({ _id: id, role: role });

        if (!user) {
            res.status(404).json({ success: false, message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found` });
            return;
        }

        // Validate fields if needed based on role
        if (role === "doctor") {
            if (updatedData.speciality && !updatedData.registrationNumber) {
                res.status(400).json({ success: false, message: "Registration number is required for doctors" });
                return;
            }
        }

        // Use findByIdAndUpdate for partial update, only the provided fields will be updated
        const updatedUser = await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });

        // Return the updated user data
        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} data updated successfully`,
            user: updatedUser,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ success: false, message: errorMessage });
    }
};

export const deleteUserDataByRoleAndId = async (req: Request<{ role: string; id: string }>, res: Response): Promise<void> => {
    try {
        const { role, id } = req.params;

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory"];
        if (!validRoles.includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role" });
            return;
        }

        // Find and delete the user by role and ID
        const user = await User.findOneAndDelete({ _id: id, role: role });

        if (!user) {
            res.status(404).json({ success: false, message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found` });
            return;
        }

        // Return a success response
        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ success: false, message: errorMessage });
    }
}; 