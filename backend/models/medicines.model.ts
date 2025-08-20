import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine extends Document {
  medicineId: number;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    medicineId: {
      type: Number,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    manufacturer: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
// medicineSchema.index({ medicineId: 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ isActive: 1 });

export const Medicine = mongoose.model<IMedicine>("Medicine", medicineSchema);