import { Request, Response } from "express";
import { Medicine, IMedicine } from "../models/medicines.model.js";
import { AuthenticatedRequest } from "../types/index.js";

// Get next medicine ID for auto-increment
const getNextMedicineId = async (): Promise<number> => {
  const lastMedicine = await Medicine.findOne({}, {}, { sort: { medicineId: -1 } });
  return lastMedicine ? lastMedicine.medicineId + 1 : 1;
};

// Get all medicines with pagination and search
export const getMedicines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      category = "",
      strength = "",
      isActive = "",
      sortBy = "name",
      sortOrder = "asc"
    } = req.query;

    // Build search query
    const searchQuery: any = {};

    // Text search
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by category
    if (category) {
      searchQuery.category = { $regex: category, $options: "i" };
    }

    // Filter by strength
    if (strength) {
      searchQuery.strength = { $regex: strength, $options: "i" };
    }

    // Filter by active status
    if (isActive !== "") {
      searchQuery.isActive = isActive === "true";
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Execute query with pagination
    const [medicines, totalCount] = await Promise.all([
      Medicine.find(searchQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      Medicine.countDocuments(searchQuery)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit as string));
    const hasNextPage = parseInt(page as string) < totalPages;
    const hasPrevPage = parseInt(page as string) > 1;

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit as string),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error: any) {
    console.error("Error in getMedicines:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Create new medicine
export const createMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, strength, manufacturer } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        message: "Medicine name is required"
      });
      return;
    }

    // Check if medicine with same name, strength, and category combination already exists
    const existingMedicine = await Medicine.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      strength: strength?.trim() || "",
      category: category?.trim() || ""
    });

    if (existingMedicine) {
      res.status(400).json({
        success: false,
        message: "Medicine with this name, strength, and type combination already exists"
      });
      return;
    }

    // Get next auto-increment ID
    const medicineId = await getNextMedicineId();

    // Create new medicine
    const newMedicine = new Medicine({
      medicineId,
      name: name.trim(),
      description: description?.trim() || "",
      category: category?.trim() || "",
      strength: strength?.trim() || "",
      manufacturer: manufacturer?.trim() || ""
    });

    await newMedicine.save();

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: newMedicine
    });

  } catch (error: any) {
    console.error("Error in createMedicine:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get single medicine by ID
export const getMedicineById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findOne({ medicineId: parseInt(id ?? "") });

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medicine
    });

  } catch (error: any) {
    console.error("Error in getMedicineById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update medicine
export const updateMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, strength, manufacturer, isActive } = req.body;

    const medicine = await Medicine.findOne({ medicineId:  parseInt(id ?? "") });

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found"
      });
      return;
    }

    // Check if new name conflicts with existing medicine (excluding current one)
    if (name && name !== medicine.name) {
      const existingMedicine = await Medicine.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        medicineId: { $ne:  parseInt(id ?? "") }
      });

      if (existingMedicine) {
        res.status(400).json({
          success: false,
          message: "Medicine with this name already exists"
        });
        return;
      }
    }

    // Update fields
    if (name) medicine.name = name.trim();
    if (description !== undefined) medicine.description = description.trim();
    if (category !== undefined) medicine.category = category.trim();
    if (strength !== undefined) medicine.strength = strength.trim();
    if (manufacturer !== undefined) medicine.manufacturer = manufacturer.trim();
    if (isActive !== undefined) medicine.isActive = isActive;

    await medicine.save();

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: medicine
    });

  } catch (error: any) {
    console.error("Error in updateMedicine:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete medicine (hard delete)
export const deleteMedicine = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findOneAndDelete({ medicineId: parseInt(id ?? "") });

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });

  } catch (error: any) {
    console.error("Error in deleteMedicine:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Get medicines for dropdown (active only)
export const getMedicinesDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let medicines = await Medicine.find({ isActive: true })
      .select('medicineId name description category strength manufacturer')
      .sort({ name: 1 })
      .lean();

    // Transform the data to concatenate all fields in the name
    const transformedMedicines = medicines.map(medicine => ({
      _id: medicine._id,
      medicineId: medicine.medicineId,
      name: `${medicine.name} ${medicine.strength || ''} ${medicine.category || ''} ${medicine.manufacturer || ''} ${medicine.description || ''}`.replace(/\s+/g, ' ').trim()
    }));

    // Put medicineId === 1 on top
    const sortedMedicines = transformedMedicines.sort((a, b) => {
      if (a.medicineId === 1) return -1;
      if (b.medicineId === 1) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      data: sortedMedicines
    });

  } catch (error: any) {
    console.error("Error in getMedicinesDropdown:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



// Create medicines in bulk
export const createBulkMedicines = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { medicines } = req.body;

    // Validate input
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({
        success: false,
        message: "Medicines array is required and cannot be empty"
      });
      return;
    }

    const results: {
      success: { name: string; strength: string; category: string; manufacturer: string; description: string; medicineId: number; lineNumber?: number }[];
      failed: { name: string; strength: string; category: string; manufacturer: string; description: string; error: string; lineNumber?: number }[];
      duplicates: { name: string; strength: string; category: string; manufacturer: string; description: string; error: string; lineNumber?: number }[];
    } = {
      success: [],
      failed: [],
      duplicates: []
    };

    // Validation functions
    const validateField = (value: string, fieldName: string, maxLength: number, allowEmpty: boolean = false): string => {
      if (!value || typeof value !== 'string') {
        return allowEmpty ? '' : `${fieldName} is required`;
      }

      const trimmedValue = value.trim();
      
      if (!allowEmpty && trimmedValue.length === 0) {
        return `${fieldName} cannot be empty`;
      }

      const nameRegex = /^[a-zA-Z0-9 ]*$/;
      if (!nameRegex.test(trimmedValue)) {
        return `${fieldName} can only contain alphabets, digits and spaces`;
      }

      if (trimmedValue.length > maxLength) {
        return `${fieldName} cannot exceed ${maxLength} characters`;
      }

      return '';
    };

    // Track duplicates within the CSV itself
    const csvDuplicateTracker = new Map<string, number>();

    for (let index = 0; index < medicines.length; index++) {
      const medicine = medicines[index];
      const lineNumber = index + 1;
      
      const { name, strength, category, manufacturer, description } = medicine;

      // Validate each field
      const nameError = validateField(name, 'Medicine name', 50);
      const strengthError = validateField(strength, 'Strength', 10);
      const categoryError = validateField(category, 'Category', 10);
      const manufacturerError = validateField(manufacturer, 'Manufacturer', 20);
      const descriptionError = validateField(description, 'Description', 40, true);

      const trimmedName = name ? name.trim() : '';
      const trimmedStrength = strength ? strength.trim() : '';
      const trimmedCategory = category ? category.trim() : '';
      const trimmedManufacturer = manufacturer ? manufacturer.trim() : '';
      const trimmedDescription = description ? description.trim() : '';

      // If any validation fails, add to failed array
      if (nameError || strengthError || categoryError || manufacturerError || descriptionError) {
        const errors = [nameError, strengthError, categoryError, manufacturerError, descriptionError]
          .filter(error => error.length > 0);
        
        results.failed.push({
          name: trimmedName,
          strength: trimmedStrength,
          category: trimmedCategory,
          manufacturer: trimmedManufacturer,
          description: trimmedDescription,
          error: errors.join(', '),
          lineNumber: lineNumber
        });
        continue;
      }

      // Create unique key for duplicate checking (name + strength + category)
      const duplicateKey = `${trimmedName.toLowerCase()}_${trimmedStrength.toLowerCase()}_${trimmedCategory.toLowerCase()}`;

      // Check for duplicates within CSV
      if (csvDuplicateTracker.has(duplicateKey)) {
        const firstOccurrenceLine = csvDuplicateTracker.get(duplicateKey);
        results.duplicates.push({
          name: trimmedName,
          strength: trimmedStrength,
          category: trimmedCategory,
          manufacturer: trimmedManufacturer,
          description: trimmedDescription,
          error: `Duplicate entry found within CSV (first occurrence at line ${firstOccurrenceLine})`,
          lineNumber: lineNumber
        });
        continue;
      }

      csvDuplicateTracker.set(duplicateKey, lineNumber);

      try {
        // Check if medicine already exists in database
        const existingMedicine = await Medicine.findOne({ 
          name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
          strength: { $regex: new RegExp(`^${trimmedStrength}$`, 'i') },
          category: { $regex: new RegExp(`^${trimmedCategory}$`, 'i') }
        });

        if (existingMedicine) {
          results.duplicates.push({
            name: trimmedName,
            strength: trimmedStrength,
            category: trimmedCategory,
            manufacturer: trimmedManufacturer,
            description: trimmedDescription,
            error: 'Medicine with same name, strength and type already exists in database',
            lineNumber: lineNumber
          });
          continue;
        }

        // Get next auto-increment ID
        const medicineId = await getNextMedicineId();

        // Create new medicine
        const newMedicine = new Medicine({
          medicineId,
          name: trimmedName,
          strength: trimmedStrength,
          category: trimmedCategory,
          manufacturer: trimmedManufacturer,
          description: trimmedDescription,
          isActive: true
        });

        await newMedicine.save();
        results.success.push({
          name: trimmedName,
          strength: trimmedStrength,
          category: trimmedCategory,
          manufacturer: trimmedManufacturer,
          description: trimmedDescription,
          medicineId: medicineId,
          lineNumber: lineNumber
        });

      } catch (error: any) {
        results.failed.push({
          name: trimmedName,
          strength: trimmedStrength,
          category: trimmedCategory,
          manufacturer: trimmedManufacturer,
          description: trimmedDescription,
          error: error.message || 'Failed to create medicine',
          lineNumber: lineNumber
        });
      }
    }

    const totalProcessed = results.success.length + results.failed.length + results.duplicates.length;
    
    res.status(200).json({
      success: true,
      message: `Bulk operation completed. ${results.success.length} medicines created, ${results.failed.length} failed, ${results.duplicates.length} duplicates found.`,
      data: {
        totalProcessed,
        successCount: results.success.length,
        failedCount: results.failed.length,
        duplicateCount: results.duplicates.length,
        results
      }
    });

  } catch (error: any) {
    console.error("Error in createBulkMedicines:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};