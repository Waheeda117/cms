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
    const { name, description, category, manufacturer } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        message: "Medicine name is required"
      });
      return;
    }

    // Check if medicine with same name already exists
    const existingMedicine = await Medicine.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingMedicine) {
      res.status(400).json({
        success: false,
        message: "Medicine with this name already exists"
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
    const { name, description, category, manufacturer, isActive } = req.body;

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
    const medicines = await Medicine.find({ isActive: true })
      .select('medicineId name')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: medicines
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