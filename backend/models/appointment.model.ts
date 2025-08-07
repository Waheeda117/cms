import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  appointmentDate: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true, // Link to doctor (User model)
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        notes: {
            type: String,
            required: false,
        }
    },
    { timestamps: true }
);

export const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema); 