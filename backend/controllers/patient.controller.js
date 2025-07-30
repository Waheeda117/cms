import { Patient } from "../models/patient.model.js";

export const patientRegistration = async (req, res) => {
    try {
        const { 
            name,
            email,
            gender, 
            dateOfBirth, 
            contactNumber, 
            address, 
            cnic,
            chiefComplaint,
            medicalHistory 
        } = req.body;

        // Validate required fields for patient
        if (!name || !email || !gender || !dateOfBirth || !contactNumber || !address || !cnic || !chiefComplaint) {
            return res.status(400).json({ 
                success: false, 
                message: "All required fields must be provided for patient registration (name, email, gender, dateOfBirth, contactNumber, address, cnic, chiefComplaint)" 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Please enter a valid email address" 
            });
        }

        // Validate CNIC format
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(cnic)) {
            return res.status(400).json({ 
                success: false, 
                message: "CNIC must be in format: 12345-1234567-1" 
            });
        }

        // Check if patient already exists with the same CNIC or email
        const patientAlreadyExists = await Patient.findOne({ 
            $or: [{ cnic }, { email }] 
        });

        if (patientAlreadyExists) {
            if (patientAlreadyExists.email === email) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Patient with this email already exists" 
                });
            }
            if (patientAlreadyExists.cnic === cnic) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Patient with this CNIC already exists" 
                });
            }
        }

        // Validate gender
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ 
                success: false, 
                message: "Gender must be male, female, or other" 
            });
        }

        // Validate date of birth (should not be in the future)
        const birthDate = new Date(dateOfBirth);
        const currentDate = new Date();
        
        if (birthDate >= currentDate) {
            return res.status(400).json({ 
                success: false, 
                message: "Date of birth cannot be in the future" 
            });
        }

        // Validate age (optional: ensure patient is not too old, e.g., over 150 years)
        const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        if (age > 150) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid date of birth" 
            });
        }

        // Validate chief complaint length
        if (chiefComplaint.length > 500) {
            return res.status(400).json({ 
                success: false, 
                message: "Chief complaint cannot exceed 500 characters" 
            });
        }

        // Create new patient
        const patient = new Patient({
            name,
            email,
            gender,
            dateOfBirth: birthDate,
            contactNumber,
            address,
            cnic,
            chiefComplaint: chiefComplaint.trim(),
            medicalHistory: medicalHistory || "" // Optional field
        });

        await patient.save();

        res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patient: {
                ...patient._doc,
            },
        });

    } catch (error) {
        console.log("Error in Patient Registration ", error);
        
        // Handle specific mongoose validation errors
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: errorMessages.join(', ') 
            });
        }

        // Handle duplicate key error (CNIC or email uniqueness)
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                success: false, 
                message: `Patient with this ${duplicateField} already exists` 
            });
        }

        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getAllPatients = async (req, res) => {
    try {
        // Fetch all patients
        const patients = await Patient.find({});

        if (!patients || patients.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No patients found" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Patients fetched successfully",
            count: patients.length,
            patients: patients
        });

    } catch (error) {
        console.log("Error in getAllPatients: ", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};

export const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find patient by ID
        const patient = await Patient.findById(id);

        if (!patient) {
            return res.status(404).json({ 
                success: false, 
                message: "Patient not found" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Patient data fetched successfully",
            patient: patient
        });

    } catch (error) {
        console.log("Error in getPatientById: ", error);
        
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid patient ID format" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};

export const updatePatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Find patient first to check if it exists
        const existingPatient = await Patient.findById(id);

        if (!existingPatient) {
            return res.status(404).json({ 
                success: false, 
                message: "Patient not found" 
            });
        }

        // If email is being updated, check for duplicates
        if (updatedData.email && updatedData.email !== existingPatient.email) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updatedData.email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Please enter a valid email address" 
                });
            }

            // Check if another patient already has this email
            const duplicatePatient = await Patient.findOne({ 
                email: updatedData.email, 
                _id: { $ne: id } 
            });

            if (duplicatePatient) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Another patient with this email already exists" 
                });
            }
        }

        // If CNIC is being updated, check for duplicates
        if (updatedData.cnic && updatedData.cnic !== existingPatient.cnic) {
            // Validate CNIC format
            const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
            if (!cnicRegex.test(updatedData.cnic)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "CNIC must be in format: 12345-1234567-1" 
                });
            }

            // Check if another patient already has this CNIC
            const duplicatePatient = await Patient.findOne({ 
                cnic: updatedData.cnic, 
                _id: { $ne: id } 
            });

            if (duplicatePatient) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Another patient with this CNIC already exists" 
                });
            }
        }

        // Validate gender if being updated
        if (updatedData.gender && !['male', 'female', 'other'].includes(updatedData.gender)) {
            return res.status(400).json({ 
                success: false, 
                message: "Gender must be male, female, or other" 
            });
        }

        // Validate date of birth if being updated
        if (updatedData.dateOfBirth) {
            const birthDate = new Date(updatedData.dateOfBirth);
            const currentDate = new Date();
            
            if (birthDate >= currentDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Date of birth cannot be in the future" 
                });
            }

            const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
            if (age > 150) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid date of birth" 
                });
            }
        }

        // Validate chief complaint if being updated
        if (updatedData.chiefComplaint) {
            if (updatedData.chiefComplaint.length > 500) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Chief complaint cannot exceed 500 characters" 
                });
            }
            updatedData.chiefComplaint = updatedData.chiefComplaint.trim();
        }

        // Update patient with new data
        const updatedPatient = await Patient.findByIdAndUpdate(
            id, 
            updatedData, 
            { 
                new: true, 
                runValidators: true 
            }
        );

        res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            patient: updatedPatient
        });

    } catch (error) {
        console.log("Error in updatePatientById: ", error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid patient ID format" 
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: errorMessages.join(', ') 
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                success: false, 
                message: `Patient with this ${duplicateField} already exists` 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};


export const deletePatientById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete patient by ID
        const patient = await Patient.findByIdAndDelete(id);

        if (!patient) {
            return res.status(404).json({ 
                success: false, 
                message: "Patient not found" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Patient deleted successfully"
        });

    } catch (error) {
        console.log("Error in deletePatientById: ", error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid patient ID format" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};