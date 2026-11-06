import type { Types } from "mongoose";
import DailyUsage from "../../models/DailyUsage.js";
import User from "../../models/User.model.js";
export const DAILY_MESSAGE_LIMIT = 50;

const getISTDate = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

export type DailyUsageReservation = {
    userId: Types.ObjectId;
    date: string;
    used: number;
    remaining: number;
};

export const checkAndConsumeDailyLimit = async (
    userId: Types.ObjectId
): Promise<DailyUsageReservation> => {
    const date = getISTDate();

    const currentCount = { $ifNull: ["$messageCount", 0] };
    const canAccept = { $lt: [currentCount, DAILY_MESSAGE_LIMIT] };

    const updatePipeline = [
        {
            $set: {
                userId: { $literal: userId },
                date: { $literal: date },
                messageCount: {
                    $cond: [canAccept, { $add: [currentCount, 1] }, currentCount],
                },
                lastRequestAccepted: canAccept,
                createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
                updatedAt: "$$NOW",
            },
        },
    ];

    const run = (upsert: boolean) =>
        DailyUsage.findOneAndUpdate({ userId, date }, updatePipeline, {
            upsert,
            new: true,
            updatePipeline: true,
        });

    let usage;
    try {
        usage = await run(true);
    } catch (error: any) {
        // Same user ki do simultaneous first requests
        if (error?.code !== 11000) throw error;
        usage = await run(false);
    }

    // FIX: pehle yahan condition ulti thi
    if (!usage || usage.lastRequestAccepted !== true) {
        throw new Error("DAILY_MESSAGE_LIMIT_REACHED");
    }

    return {
        userId,
        date,
        used: usage.messageCount,
        remaining: DAILY_MESSAGE_LIMIT - usage.messageCount,
    };
};

// Answer fail ho jaye to slot wapas de do
export const releaseDailyLimit = async (
    reservation: DailyUsageReservation
): Promise<void> => {
    await DailyUsage.updateOne(
        {
            userId: reservation.userId,
            date: reservation.date,
            messageCount: { $gt: 0 },
        },
        { $inc: { messageCount: -1 } }
    );
};

// Answer successfully generate hone ke baad user ke lifetime stats update karo
export const recordQuestionAsked = async (
    userId: Types.ObjectId,
    usage: { input: number; output: number }
): Promise<void> => {
    await User.updateOne(
        { _id: userId },
        {
            $inc: {
                "stats.totalQuestionsAsked": 1,
                "stats.totalInputTokens": usage.input,
                "stats.totalOutputTokens": usage.output,
            },
            $set: { "stats.lastQuestionAt": new Date() },
        }
    );
};