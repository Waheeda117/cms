import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  cnic?: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'pharmacist_dispenser' | 'pharmacist_inventory';
  isDefaultPassword: boolean;
  lastLogin: Date;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  phoneNumber?: string;
  isActive: boolean;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  speciality?: string;
  registrationNumber?: string;
  doctorSchedule?: string[];
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: false, // Made optional
      unique: false,
      sparse: true, // Allows multiple null values
    },
    password: {
      type: String,
      required: true,
    },
    // Split name into firstName and lastName
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    // Added username field
    username: {
      type: String,
      required: true,
      unique: true,
    },
    cnic: {
      type: String,
      required: false, // Made optional
      unique: false,
      sparse: true, // Allows multiple null values
      validate: {
        validator: function (v: string): boolean {
          if (!v) return true; // Allow empty/null values
          // CNIC format: 12345-1234567-1 (13 digits with dashes)
          return /^\d{5}-\d{7}-\d{1}$/.test(v);
        },
        message: "CNIC must be in format: 12345-1234567-1",
      },
    },
    role: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "receptionist",
        "pharmacist_dispenser",
        "pharmacist_inventory",
      ],
      required: true,
    },
    
    // Add the isDefaultPassword flag
    isDefaultPassword: {
      type: Boolean,
      default: function(this: IUser): boolean {
        return this.role !== "admin"; // Only set to true for non-admin roles
      },
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,

    // Profile-specific fields
    phoneNumber: {
      type: String,
      required: function (this: IUser): boolean {
        return this.role !== "admin"; // Only required for non-admins
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: function (this: IUser): boolean {
        return this.role !== "admin"; // Only required for non-admins
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: function (this: IUser): boolean {
        return this.role !== "admin"; // Made mandatory for non-admins
      },
    },
    address: {
      type: String,
      required: function (this: IUser): boolean {
        return this.role !== "admin"; // Only required for non-admins
      },
    },

    speciality: {
      type: String,
      required: function (this: IUser): boolean {
        return this.role === "doctor";
      },
      validate: {
        validator: function(v: string): boolean {
          // Allow empty/null for non-doctors, require value for doctors
          if (this.role !== "doctor") return true;
          return v != null && v.trim().length > 0;
        },
        message: "Speciality is required for doctors"
      }
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true, // This allows null values and prevents unique constraint issues
      required: function (this: IUser): boolean {
        return this.role === "doctor";
      },
      validate: {
        validator: function(v: string): boolean {
          if (this.role !== "doctor") return true;
          return v != null && v.trim().length > 0;
        },
        message: "Registration number is required for doctors"
      }
    },
    doctorSchedule: {
      type: [String], // e.g., ["Monday", "Tuesday", ...]
      required: function (this: IUser): boolean {
        return this.role === "doctor"; // Only for doctors
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema); 