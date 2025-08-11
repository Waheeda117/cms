import mongoose, { Document, Schema } from "mongoose";

// Interface for individual medicines within a batch
export interface IBatchMedicine {
  medicineId: number;
  medicineName: string;
  quantity: number;
  price: number; // Selling price per unit
  expiryDate: Date;
  dateOfPurchase: Date;
  reorderLevel: number;
  totalAmount: number;
}

// Main inventory interface for batch management
export interface IInventory extends Document {
  batchNumber: string;
  billID: string;
  medicines: IBatchMedicine[];
  overallPrice: number;
  miscellaneousAmount: number;
  attachments: string[]; // Array of Cloudinary URLs
  isDraft: boolean;
  draftNote: string;
  finalizedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for individual medicines within a batch
const batchMedicineSchema = new Schema<IBatchMedicine>({
  medicineId: {
    type: Number,
    required: true,
  },
  medicineName: { 
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  price: { // Selling price per unit
    type: Number,
    required: true,
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  dateOfPurchase: {
    type: Date,
    required: true,
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  }
}, { _id: true });

// Main inventory schema for batch management
const inventorySchema = new Schema<IInventory>(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billID: {
      type: String,
      required: true,
    },
    medicines: [batchMedicineSchema], // Array of medicines in this batch
    overallPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    miscellaneousAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    attachments: {
      type: [String], // Array of Cloudinary URLs
      default: [],
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    draftNote: {
      type: String,
      default: '',
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

// Create indexes for efficient querying
// inventorySchema.index({ batchNumber: 1 });
inventorySchema.index({ billID: 1 }); // Added missing index
inventorySchema.index({ "medicines.medicineId": 1 });
inventorySchema.index({ "medicines.medicineName": 1 });
inventorySchema.index({ createdAt: -1 });
inventorySchema.index({ isDraft: 1 }); // New index for draft filtering

export const Inventory = mongoose.model<IInventory>("Inventory", inventorySchema);