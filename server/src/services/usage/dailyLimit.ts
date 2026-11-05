
import type { Types } from "mongoose";
import DailyUsage from "../../models/DailyUsage.js";
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
  userId: Types.ObjectId,
): Promise<DailyUsageReservation> => {
  const date = getISTDate();

  const currentCount = {
    $ifNull: ["$messageCount", 0],
  };

  const canAccept = {
    $lt: [currentCount, DAILY_MESSAGE_LIMIT],
  };

  const updatePipeline = [
    {
      $set: {
        userId: { $literal: userId },
        date: { $literal: date },

        messageCount: {
          $cond: [
            canAccept,
            { $add: [currentCount, 1] },
            currentCount,
          ],
        },

        lastRequestAccepted: canAccept,
        updatedAt: new Date(),
      },
    },
  ];

  let usage;

  try {
    usage = await DailyUsage.findOneAndUpdate(
      { userId, date },
      updatePipeline,
      {
        upsert: true,
        new: true,
        updatePipeline: true, // IMPORTANT FIX
      },
    );
  } catch (error: any) {
    // Handle simultaneous first requests for the same user/day.
    if (error?.code !== 11000) {
      throw error;
    }

    usage = await DailyUsage.findOneAndUpdate(
      { userId, date },
      updatePipeline,
      {
        new: true,
        updatePipeline: true, // IMPORTANT FIX
      },
    );
  }

  if (!usage || !usage.lastRequestAccepted) {
    throw new Error("DAILY_MESSAGE_LIMIT_REACHED");
  }

  return {
    userId,
    date,
    used: usage.messageCount,
    remaining: DAILY_MESSAGE_LIMIT - usage.messageCount,
  };
};

export const releaseDailyLimit = async (
  reservation: DailyUsageReservation,
): Promise<void> => {
  await DailyUsage.updateOne(
    {
      userId: reservation.userId,
      date: reservation.date,
      messageCount: { $gt: 0 },
    },
    {
      $inc: { messageCount: -1 },
    },
  );
};
