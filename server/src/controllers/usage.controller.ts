
import type { Request, Response } from "express";

import DailyUsage from "../models/DailyUsage.js";

const DAILY_QUESTION_LIMIT = Number(
    process.env.DAILY_QUESTION_LIMIT || 50
);

const getISTDate = (): string => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
};

export const getDailyUsage = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const today = getISTDate();

        const usage = await DailyUsage.findOne({
            userId: req.userId,
            date: today,
        }).lean();

        const used = usage?.messageCount ?? 0;
        const limit = DAILY_QUESTION_LIMIT;

        res.status(200).json({
            success: true,
            usage: {
                used,
                limit,
                remaining: Math.max(0, limit - used),
                date: today,
            },
        });
    } catch (error) {
        console.error("Get daily usage error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch usage information.",
        });
    }
};
