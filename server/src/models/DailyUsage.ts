import mongoose, { Schema, Types } from "mongoose";

export interface IDailyUsage {
    userId: Types.ObjectId;
    date: string;
    messageCount: number;
    lastRequestAccepted: boolean;
}

const dailyUsageSchema = new Schema<IDailyUsage>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: String, required: true },
        messageCount: { type: Number, default: 0, min: 0 },
        lastRequestAccepted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

dailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyUsage =
    mongoose.models.DailyUsage ||
    mongoose.model<IDailyUsage>("DailyUsage", dailyUsageSchema);

export default DailyUsage;