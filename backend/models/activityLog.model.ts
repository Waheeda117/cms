import mongoose, { Document, Schema } from "mongoose";

export interface IActivityLog extends Document {
  batchId: mongoose.Types.ObjectId;
  batchNumber: string;
  action: string;
  details: string;
  owner: mongoose.Types.ObjectId;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
}

const activityLogSchema = new Schema<IActivityLog>({
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
    index: true
  },
  batchNumber: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATED', 'FINALIZED', 'UPDATED', 'DELETED']
  },
  details: {
    type: String,
    required: true,
    maxlength: 500
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }]
}, { 
  timestamps: false // We're using our own timestamp field
});

// Compound indexes for efficient querying
activityLogSchema.index({ batchId: 1, timestamp: -1 });
activityLogSchema.index({ batchNumber: 1, timestamp: -1 });
activityLogSchema.index({ owner: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);