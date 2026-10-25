
import mongoose, { Schema, Types } from "mongoose";

interface IUsageLog {
  ownerId: Types.ObjectId;
  actionType: string;
  tokensIn: number;
  tokensOut: number;
  estimatedCost: number;
  requestId: string;
  createdAt: Date;
}

const usageLogSchema = new Schema<IUsageLog>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  actionType: {
    type: String,
    required: true,
  },
  tokensIn: { type: Number, default: 0, min: 0 },
  tokensOut: { type: Number, default: 0, min: 0 },
  estimatedCost: { type: Number, default: 0, min: 0 },
  requestId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

usageLogSchema.index({ ownerId: 1, createdAt: -1 });
usageLogSchema.index({ requestId: 1 }, { unique: true });

const UsageLog = mongoose.model<IUsageLog>(
  "UsageLog",
  usageLogSchema,
);

export default UsageLog;
