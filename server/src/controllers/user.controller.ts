import { application, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.model.js"
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";
import Chat from "../models/Chats.model.js";
import Message from "../models/Message.model.js";
import DailyUsage from "../models/DailyUsage.js";

const THEMES = ["light", "dark", "system"] as const;

type Theme = (typeof THEMES)[number];

// update profile

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {

        const { name, email } = req.body;

        if (typeof name !== "string" || typeof email !== "string") {
            res.status(400).json({ success: false, message: "Provide a valid name and email" });
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: req.userId }
        });

        if (existingUser) {
            res.status(409).json({ success: false, message: "User already exists" });
            return;
        }

        await User.findByIdAndUpdate(
            req.userId,
            {
                $set: {
                    name: name.trim(),
                    email: normalizedEmail,
                },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        ).select("name email theme stats createdAt");

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                theme: user.theme,
                createdAt: user.createdAt,
            },
        })

    } catch (err) {
        console.error("Update profile error:", err);

        res.status(500).json({
            success: false,
            message: "Unable to update profile.",
        });
    }
}

// update theme
const allowedThemes = ["ember", "emerald", "daylight"];

export const updateTheme = async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;
    const userId = req.userId;

    if (!allowedThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theme",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { theme },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Theme updated successfully",
      theme: user.theme,
    });
  } catch (error) {
    console.error("Theme update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update theme",
    });
  }
};

// change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            newPassword.length < 8 ||
            newPassword.length > 12
        ) {
            res.status(400).json({
                success: false,
                message: "New password must contain 8-12 characters.",
            });
            return;
        }

        const user = await User.findById(req.userId).select("+passwordHash");

        if(!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: "Invalid password" });
            return;
        }

        const samePassword = await bcrypt.compare(newPassword, user.passwordHash);

        if (samePassword) {
            res.status(400).json({ success: false, message: "New password must be different from current password" });
            return;
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });

    } catch (err) {
        console.error("Change password error:", err);

        res.status(500).json({
            success: false,
            message: "Unable to change password.",
        });
    }
}

export const exportUserData = async(req: Request, res: Response): Promise<void> => {
    try{
        const user = await User.findById(req.userId).select("-passwordHash");

        if(!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const [
            documents,
            chats,
            messages,
            dailyUsage,
        ] = await Promise.all([
            Document.find({ ownerId: req.userId })
                .select("-storageKey -extractedText")
                .lean(),

            Chat.find({ ownerId: req.userId }).lean(),

            Message.find({ ownerId: req.userId }).lean(),

            DailyUsage.find({ userId: req.userId }).lean(),
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            application:"DocuMind AI",

            profile:{
                id: user._id,
                name: user.name,
                email: user.email,
                theme: user.theme,
                stats: user.stats,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            documents,
            chats,
            messages,
            dailyUsage,
        }

        const filename = `document-data-${new Date().toISOString().slice(0, 10)}.json`;

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${filename}`
        )

        res.setHeader("Content-Type", "application/json");

        res.status(200).json(exportData);
    }catch(error){
        console.error("Export user data error:", error);
        res.status(500).json({ success: false, message: "Unable to export user data." });
    }
}

// delete account
export const deleteAccount = async (
    req: Request,
    res: Response
): Promise<void> => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const user = await User.findById(req.userId).session(session);

            if (!user) {
                throw new Error("USER_NOT_FOUND");
            }

            const documents = await Document.find({
                ownerId: req.userId,
            })
                .select("_id")
                .session(session)
                .lean();

            const documentIds = documents.map((doc) => doc._id);

            await Promise.all([
                Chunk.deleteMany({
                    ownerId: req.userId,
                }).session(session),

                Message.deleteMany({
                    ownerId: req.userId,
                }).session(session),

                Chat.deleteMany({
                    ownerId: req.userId,
                }).session(session),

                Document.deleteMany({
                    ownerId: req.userId,
                }).session(session),

                DailyUsage.deleteMany({
                    userId: req.userId,
                }).session(session),
            ]);

            await User.deleteOne({
                _id: req.userId,
            }).session(session);
        });

        const { maxAge, ...clearOptions } = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        };

        res.clearCookie("token", clearOptions);

        res.status(200).json({
            success: true,
            message: "Account and associated database records deleted successfully.",
        });
    } catch (error) {
        console.error("Delete account error:", error);

        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Unable to delete account.",
        });
    } finally {
        await session.endSession();
    }
};