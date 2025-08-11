import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

// User Types - This is now imported from the User model
export interface IUser {
  _id: string;
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
}

export interface IUserInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'nurse' | 'pharmacist';
}

// Patient Types
export interface IPatient extends Document {
  _id: string;
  name: string;
  cnic: string;
  phone: string;
  email?: string;
  address: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string;
  allergies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientInput {
  name: string;
  cnic: string;
  phone: string;
  email?: string;
  address: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string;
  allergies?: string[];
}

// Appointment Types
export interface IAppointment extends Document {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentInput {
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  reason: string;
  notes?: string;
}

// Prescription Types
export interface IPrescription extends Document {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  prescribedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescriptionInput {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  diagnosis: string;
  notes?: string;
}

// Inventory Types
export interface IInventory extends Document {
  _id: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  supplier?: string;
  location?: string;
  expiryDate?: Date;
  batchNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryInput {
  name: string;
  category: string;
  description?: string;
  unit: string;
  price: number;
  cost: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  supplier?: string;
  location?: string;
  expiryDate?: Date;
  batchNumber?: string;
}

// Auth Types
export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
  role?: 'admin' | 'doctor' | 'nurse' | 'pharmacist';
  cnic?: string;
}

export interface IResetPasswordRequest {
  email: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// JWT Payload
export interface IJWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Request Extensions
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Pagination Types
export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// File Upload Types
export interface FileUploadRequest extends Request {
  file?: Express.Multer.File | undefined;
  files?: Express.Multer.File[];
}

// Email Types
export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

// Dashboard Types
export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalPrescriptions: number;
  totalInventory: number;
  lowStockItems: number;
  upcomingAppointments: number;
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Middleware Types
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Database Types
export interface DatabaseConnection {
  isConnected: boolean;
}

// Environment Variables
export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  COOKIE_EXPIRE: string;
  FRONTEND_URL?: string;
  MAILTRAP_TOKEN?: string;
  MAILTRAP_SENDER?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
} 