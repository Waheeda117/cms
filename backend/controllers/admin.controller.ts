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

export const registerPharmacistInventoryStaffFromAdmin = async (req: Request<{}, {}, UserRegistrationData>, res: Response): Promise<void> => {
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
                message: "All required fields must be provided for pharmacist_inventory_staff registration"
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

        // Create pharmacist_inventory_staff user
        const pharmacistInventoryStaff = new User({
            email: email || undefined, // Don't set email to null, set it as undefined if not provided
            password: hashedPassword,
            firstName,
            lastName,
            username,
            isDefaultPassword: true,
            cnic: cnic || undefined, // Don't set cnic to null, set it as undefined if not provided
            role: "pharmacist_inventory_staff",
            phoneNumber,
            address,
            gender,
            isActive: true,
            isVerified: false
        });

        await pharmacistInventoryStaff.save();

        res.status(201).json({
            success: true,
            message: "Pharmacist Inventory Staff registered successfully",
            user: { ...pharmacistInventoryStaff.toObject(), password: undefined }
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
            pharmacist_inventory: 0,
            pharmacist_inventory_staff: 0 // Add this new role
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
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory", "pharmacist_inventory_staff"]; // Add the new role
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
        const updatedData = req.body;

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory", "pharmacist_inventory_staff"]; // Add the new role
        if (!validRoles.includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role" });
            return;
        }

        // ... rest of the function remains the same
        // Find the user by role and ID
        const user = await User.findOne({ _id: id, role: role });

        if (!user) {
            res.status(404).json({ success: false, message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found` });
            return;
        }

        // Create a clean update object based on role
        const cleanUpdateData: any = {};

        // Common fields for all roles
        if (updatedData.firstName) cleanUpdateData.firstName = updatedData.firstName;
        if (updatedData.lastName) cleanUpdateData.lastName = updatedData.lastName;
        if (updatedData.phoneNumber) cleanUpdateData.phoneNumber = updatedData.phoneNumber;
        if (updatedData.address) cleanUpdateData.address = updatedData.address;
        if (updatedData.gender) cleanUpdateData.gender = updatedData.gender;

        // Handle isActive field specifically (boolean field that can be false)
        if (updatedData.hasOwnProperty('isActive')) {
            cleanUpdateData.isActive = updatedData.isActive;
        }

        // For email: always include it in the update (empty string will clear the field)
        if (updatedData.hasOwnProperty('email')) {
            cleanUpdateData.email = updatedData.email ? updatedData.email.trim() : null;
        }

        // For CNIC: always include it in the update (empty string will clear the field)  
        if (updatedData.hasOwnProperty('cnic')) {
            cleanUpdateData.cnic = updatedData.cnic ? updatedData.cnic.trim() : null;
        }

        // Role-specific fields
        if (role === "doctor") {
            if (updatedData.speciality && updatedData.speciality.trim()) {
                cleanUpdateData.speciality = updatedData.speciality.trim();
            }
            if (updatedData.registrationNumber && updatedData.registrationNumber.trim()) {
                // Check if the registration number is already taken by another doctor
                const existingDoctor = await User.findOne({
                    registrationNumber: updatedData.registrationNumber.trim(),
                    _id: { $ne: id }
                });
                
                if (existingDoctor) {
                    res.status(400).json({ 
                        success: false, 
                        message: "Registration number already exists for another doctor" 
                    });
                    return;
                }
                
                cleanUpdateData.registrationNumber = updatedData.registrationNumber.trim();
            }
            if (updatedData.doctorSchedule && Array.isArray(updatedData.doctorSchedule)) {
                cleanUpdateData.doctorSchedule = updatedData.doctorSchedule;
            }
        }

        // Additional validation for doctors
        if (role === "doctor") {
            if (cleanUpdateData.speciality && !cleanUpdateData.registrationNumber && !user.registrationNumber) {
                res.status(400).json({ success: false, message: "Registration number is required for doctors" });
                return;
            }
        }

        // Use findByIdAndUpdate with clean data
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            cleanUpdateData, 
            { 
                new: true, 
                runValidators: true,
                context: 'query' // This helps with conditional validation
            }
        ).select("-password");

        res.status(200).json({
            success: true,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} data updated successfully`,
            user: updatedUser,
        });
    } catch (error: unknown) {
        console.error("Update error:", error);
        
        // Type guard for MongoDB errors
        interface MongoError extends Error {
            code?: number;
            keyPattern?: Record<string, any>;
        }

        // Type guard for Mongoose validation errors
        interface ValidationError extends Error {
            name: string;
            errors: Record<string, { message: string }>;
        }

        // Type guard for Mongoose cast errors
        interface CastError extends Error {
            name: string;
            path: string;
            value: any;
        }

        // Handle MongoDB duplicate key errors specifically
        if (error && typeof error === 'object' && 'code' in error && (error as MongoError).code === 11000) {
            const mongoError = error as MongoError;
            const field = Object.keys(mongoError.keyPattern || {})[0];
            const message = `${field || 'Field'} already exists. Please use a different value.`;
            res.status(400).json({ success: false, message });
            return;
        }

        // Handle validation errors
        if (error && typeof error === 'object' && 'name' in error && (error as ValidationError).name === 'ValidationError') {
            const validationError = error as ValidationError;
            const messages = Object.values(validationError.errors).map(err => err.message);
            res.status(400).json({ success: false, message: messages.join(', ') });
            return;
        }

        // Handle cast errors
        if (error && typeof error === 'object' && 'name' in error && (error as CastError).name === 'CastError') {
            const castError = error as CastError;
            res.status(400).json({ success: false, message: `Invalid ${castError.path}: ${castError.value}` });
            return;
        }

        // Handle generic errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ success: false, message: errorMessage });
    }
};

export const deleteUserDataByRoleAndId = async (req: Request<{ role: string; id: string }>, res: Response): Promise<void> => {
    try {
        const { role, id } = req.params;

        // Validate that the role is one of the allowed roles
        const validRoles = ["doctor", "receptionist", "pharmacist_dispenser", "pharmacist_inventory", "pharmacist_inventory_staff"]; // Add the new role
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