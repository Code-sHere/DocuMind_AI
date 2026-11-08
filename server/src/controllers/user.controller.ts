import type { Request, Response } from "express";
import mongoose from "mongoose";
import { clerkClient } from "@clerk/express";

import User from "../models/User.model.js";
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";
import Chat from "../models/Chats.model.js";
import Message from "../models/Message.model.js";
import DailyUsage from "../models/DailyUsage.js";

const allowedThemes = ["ember", "emerald", "daylight"];

// Clerk ke error se readable message nikalta hai
const getClerkErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === "object" && error !== null && "errors" in error) {
        const errors = (
            error as { errors?: { longMessage?: string; message?: string }[] }
        ).errors;

        const first = errors?.[0];
        const message = first?.longMessage ?? first?.message;

        if (message) return message;
    }

    return fallback;
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE
// FIX: Pehle yahan `User.findOne({ email: newEmail })` se user dhoondha jaata tha,
// jo naya email hone par hamesha 404 deta tha. Ab seedha logged-in user update hota hai.
// Clerk mein email verify karna padta hai, isliye email yahan change nahi hota.
// ---------------------------------------------------------------------------
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email } = req.body;

        if (typeof name !== "string") {
            res.status(400).json({ success: false, message: "Provide a valid name" });
            return;
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2 || trimmedName.length > 100) {
            res.status(400).json({
                success: false,
                message: "Name must be between 2 and 100 characters",
            });
            return;
        }

        const user = await User.findById(req.userId);

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        if (
            typeof email === "string" &&
            email.trim() &&
            email.trim().toLowerCase() !== user.email
        ) {
            res.status(400).json({
                success: false,
                message: "Email cannot be changed here. It is managed by your sign-in account.",
            });
            return;
        }

        user.name = trimmedName;
        await user.save();

        // Clerk ke saath bhi naam sync karo (fail ho to bhi profile save ho chuka hai)
        if (user.clerkUserId) {
            try {
                const [firstName, ...rest] = trimmedName.split(/\s+/);

                await clerkClient.users.updateUser(user.clerkUserId, {
                    firstName,
                    lastName: rest.join(" "),
                });
            } catch (clerkError) {
                console.error("Clerk name sync failed:", clerkError);
            }
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
        });
    } catch (err) {
        console.error("Update profile error:", err);

        res.status(500).json({
            success: false,
            message: "Unable to update profile.",
        });
    }
};

// ---------------------------------------------------------------------------
// UPDATE THEME
// ---------------------------------------------------------------------------
export const updateTheme = async (req: Request, res: Response): Promise<void> => {
    try {
        const { theme } = req.body;

        if (typeof theme !== "string" || !allowedThemes.includes(theme)) {
            res.status(400).json({ success: false, message: "Invalid theme" });
            return;
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { theme },
            { new: true, runValidators: true }
        ).select("theme");

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Theme updated successfully",
            theme: user.theme,
        });
    } catch (error) {
        console.error("Theme update error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update theme",
        });
    }
};

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// FIX: Password ab Clerk ke paas hota hai (MongoDB mein passwordHash nahi hota),
// isliye pehle wala bcrypt.compare(undefined) crash karta tha. Ab Clerk API se
// current password verify karke naya password set hota hai.
// ---------------------------------------------------------------------------
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

        if (currentPassword === newPassword) {
            res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
            return;
        }

        const user = await User.findById(req.userId);

        if (!user || !user.clerkUserId) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const clerkUser = await clerkClient.users.getUser(user.clerkUserId);

        if (!clerkUser.passwordEnabled) {
            res.status(400).json({
                success: false,
                message: "Your account signs in with a social provider and has no password.",
            });
            return;
        }

        let verified = false;

        try {
            const result = await clerkClient.users.verifyPassword({
                userId: user.clerkUserId,
                password: currentPassword,
            });

            verified = result.verified;
        } catch {
            verified = false;
        }

        if (!verified) {
            res.status(401).json({ success: false, message: "Current password is incorrect" });
            return;
        }

        try {
            await clerkClient.users.updateUser(user.clerkUserId, {
                password: newPassword,
            });
        } catch (clerkError) {
            res.status(422).json({
                success: false,
                message: getClerkErrorMessage(clerkError, "Password was rejected."),
            });
            return;
        }

        res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        console.error("Change password error:", err);

        res.status(500).json({
            success: false,
            message: "Unable to change password.",
        });
    }
};

// ---------------------------------------------------------------------------
// EXPORT USER DATA
// ---------------------------------------------------------------------------
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.userId).select("-passwordHash");

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const [documents, chats, messages, dailyUsage] = await Promise.all([
            Document.find({ ownerId: req.userId })
                .select("-storageKey -extractedText")
                .lean(),

            Chat.find({ ownerId: req.userId }).lean(),

            Message.find({ ownerId: req.userId }).lean(),

            DailyUsage.find({ userId: req.userId }).lean(),
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            application: "DocuMind AI",

            profile: {
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
        };

        const filename = `document-data-${new Date().toISOString().slice(0, 10)}.json`;

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/json");

        res.status(200).json(exportData);
    } catch (error) {
        console.error("Export user data error:", error);
        res.status(500).json({ success: false, message: "Unable to export user data." });
    }
};

// ---------------------------------------------------------------------------
// DELETE ACCOUNT
// FIX: Ab Clerk account bhi delete hota hai (pehle sirf MongoDB data jaata tha,
// aur purana "token" cookie clear karne ka code bekaar tha).
// ---------------------------------------------------------------------------
export const deleteAccount = async (
    req: Request,
    res: Response
): Promise<void> => {
    const session = await mongoose.startSession();

    // `as` use kiya hai taaki TypeScript callback ke andar hua assignment bhi maane
    let clerkUserId = undefined as string | undefined;

    try {
        await session.withTransaction(async () => {
            const user = await User.findById(req.userId).session(session);

            if (!user) {
                throw new Error("USER_NOT_FOUND");
            }

            clerkUserId = user.clerkUserId;

            await Promise.all([
                Chunk.deleteMany({ ownerId: req.userId }).session(session),
                Message.deleteMany({ ownerId: req.userId }).session(session),
                Chat.deleteMany({ ownerId: req.userId }).session(session),
                Document.deleteMany({ ownerId: req.userId }).session(session),
                DailyUsage.deleteMany({ userId: req.userId }).session(session),
            ]);

            await User.deleteOne({ _id: req.userId }).session(session);
        });

        // Database clean ho gaya, ab Clerk account hatao
        if (clerkUserId) {
            try {
                await clerkClient.users.deleteUser(clerkUserId);
            } catch (clerkError) {
                console.error("Clerk user deletion failed:", clerkError);
            }
        }

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