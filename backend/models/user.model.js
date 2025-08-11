import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
        validator: function (v) {
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
      default: function() {
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
      required: function () {
        return this.role !== "admin"; // Only required for non-admins
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: function () {
        return this.role !== "admin"; // Only required for non-admins
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: function () {
        return this.role !== "admin"; // Made mandatory for non-admins
      },
    },
    address: {
      type: String,
      required: function () {
        return this.role !== "admin"; // Only required for non-admins
      },
    },

    // Medical related fields (for Doctors/Pharmacists/Receptionists)
    speciality: {
      type: String,
      required: function () {
        return this.role === "doctor"; // Only for doctors
      },
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role === "doctor"; // Only for doctors
      },
    },
    doctorSchedule: {
      type: [String], // e.g., ["Monday", "Tuesday", ...]
      required: function () {
        return this.role === "doctor"; // Only for doctors
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);