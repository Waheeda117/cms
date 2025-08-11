import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
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

export const Appointment = mongoose.model("Appointment", appointmentSchema);
