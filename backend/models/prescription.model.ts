import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine {
  name: string;
  dosage: string;
  quantity: number;
}

export interface IPrescription extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  medicines: IMedicine[];
  issuedDate: Date;
  pharmacyStatus: 'pending' | 'fulfilled' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctor: {
            type: Schema.Types.ObjectId,
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
            required: function(this: IPrescription): boolean {
                return this.pharmacyStatus === 'rejected';
            },
        }
    },
    { timestamps: true }
);

export const Prescription = mongoose.model<IPrescription>("Prescription", prescriptionSchema); 