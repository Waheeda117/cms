import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        medicines: [{
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            quantity: { type: Number, required: true },
        }],
        issuedDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        pharmacyStatus: {
            type: String,
            enum: ['pending', 'fulfilled', 'rejected'],
            default: 'pending',
        },
        rejectionReason: {
            type: String,
            required: function() {
                return this.pharmacyStatus === 'rejected';
            },
        }
    },
    { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);
