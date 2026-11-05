
import type { Request, Response } from "express";
import mongoose from "mongoose";

import Document from "../models/Documents.model.js";
import Chat from "../models/Chats.model.js";
import Message from "../models/Message.model.js";

import { answerQuestion } from "../services/chat/answerQuestion.js";

import {
    checkAndConsumeDailyLimit,
    releaseDailyLimit,
    type DailyUsageReservation,
} from "../services/usage/dailyLimit.js";

type AuthRequest = Request & {
    userId: string;
};

const getAuthenticatedUserId = (
    req: AuthRequest,
): mongoose.Types.ObjectId | null => {
    if (!req.userId || !mongoose.Types.ObjectId.isValid(req.userId)) {
        return null;
    }

    return new mongoose.Types.ObjectId(req.userId);
};

// CREATE CHAT
export const createChat = async (req: AuthRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in.",
            });
        }

        const { documentIds, title } = req.body;

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one document is required.",
            });
        }

        if (documentIds.length > 10) {
            return res.status(400).json({
                success: false,
                message: "You can select a maximum of 10 documents.",
            });
        }

        const validIds = documentIds.every((id: string) =>
            mongoose.Types.ObjectId.isValid(id),
        );

        if (!validIds) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        const documents = await Document.find({
            _id: { $in: documentIds },
            ownerId: userId,
            status: "ready",
        }).select("_id");

        if (documents.length !== documentIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some documents are invalid or not ready.",
            });
        }

        const chat = await Chat.create({
            ownerId: userId,
            title: title?.trim() || "New chat",
            documentIds: documents.map((doc) => doc._id),
        });

        return res.status(201).json({
            success: true,
            message: "Chat created successfully.",
            chat,
        });
    } catch (error) {
        console.error("CREATE CHAT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create chat.",
        });
    }
};

// SEND MESSAGE
export const sendMessage = async (req: AuthRequest, res: Response) => {
    let reservation: DailyUsageReservation | null = null;

    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in.",
            });
        }

        const chatId = req.params.chatId as string;
        const { content } = req.body;

        // Validate chat ID
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat ID.",
            });
        }

        // Validate message
        if (
            typeof content !== "string" ||
            !content.trim() ||
            content.trim().length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Message must be between 1 and 2000 characters.",
            });
        }

        const question = content.trim();

        // Verify chat ownership
        const chat = await Chat.findOne({
            _id: chatId,
            ownerId: userId,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found.",
            });
        }

        // Get ready documents belonging to this user and chat
        const docs = await Document.find({
            _id: { $in: chat.documentIds },
            ownerId: userId,
            status: "ready",
        }).select("_id filename");

        if (docs.length === 0) {
            return res.status(409).json({
                success: false,
                message: "No ready documents found in this chat.",
            });
        }

        // Get recent conversation history
        const recentMessages = await Message.find({
            chatId: chat._id,
            ownerId: userId,
        })
            .sort({ createdAt: -1 })
            .limit(4)
            .select("role content");

        const history = recentMessages.reverse().map((message) => ({
            role: message.role,
            content: message.content,
        }));

        // RESERVE DAILY QUESTION LIMIT
        // This counts all user messages, including conversation messages.
        reservation = await checkAndConsumeDailyLimit(userId);

        // Generate AI answer
        const result = await answerQuestion(
            question,
            userId.toString(),
            docs.map((doc) => doc._id),
            history,
        );

        // Save user's question
        const userMessage = await Message.create({
            chatId: chat._id,
            ownerId: userId,
            role: "user",
            content: question,
        });

        // Save assistant's answer
        const assistantMessage = await Message.create({
            chatId: chat._id,
            ownerId: userId,
            role: "assistant",
            content: result.content,
            trustLevel: result.trustLevel,
            citations: result.citations.map((citation) => ({
                documentId: citation.documentId,
                chunkId: citation.chunkId,
                pageNumber: citation.pageNumber,
                excerpt: citation.excerpt,
                relevanceScore: citation.relevanceScore,
            })),
            tokenUsage: result.tokenUsage,
            modelUsed: result.modelUsed,
            latencyMs: result.latencyMs,
        });

        // Update chat activity
        if (chat.title === "New chat") {
            chat.title = question.slice(0, 50);
        }

        chat.updatedAt = new Date();
        await chat.save();

        return res.status(200).json({
            success: true,
            message: "Message sent successfully.",
            data: {
                userMessage,
                assistantMessage,
            },
            usage: {
                limit: 50,
                used: reservation.used,
                remaining: reservation.remaining,
                resetTimezone: "Asia/Kolkata",
            },
        });
    } catch (error: any) {
        console.error("SEND MESSAGE ERROR:", error);

        // Release the reserved question if processing failed.
        if (reservation) {
            try {
                await releaseDailyLimit(reservation);
            } catch (releaseError) {
                console.error("DAILY LIMIT RELEASE ERROR:", releaseError);
            }
        }

        // Daily limit reached
        if (error?.message === "DAILY_MESSAGE_LIMIT_REACHED") {
            return res.status(429).json({
                success: false,
                code: "DAILY_MESSAGE_LIMIT_REACHED",
                message:
                    "You have reached your daily limit of 50 questions. Your limit will reset at midnight IST.",
                usage: {
                    limit: 50,
                    remaining: 0,
                    resetTimezone: "Asia/Kolkata",
                },
            });
        }

        // AI errors
        if (
            error?.message === "AI_TIMEOUT" ||
            error?.message === "AI_BAD_RESPONSE" ||
            error?.message === "AI_UNAVAILABLE"
        ) {
            return res.status(502).json({
                success: false,
                message: "AI service is temporarily unavailable. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to send message.",
        });
    }
};

// GET USER CHATS
export const getChats = async (req: AuthRequest, res: Response) => {
    try {

        const userId = getAuthenticatedUserId(req);

        const chats = await Chat.find({ ownerId: userId })
            .sort({ pinned: -1, updatedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            chats,
        });
    } catch (error) {
        console.error("GET CHATS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch chats.",
        });
    }
};

// GET CHAT MESSAGES
export const getChatMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const chatId = req.params.chatId as string;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat ID.",
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            ownerId: userId,
        }).select("_id");

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found.",
            });
        }

        const messages = await Message.find({
            chatId: chat._id,
            ownerId: userId,
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("GET CHAT MESSAGES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages.",
        });
    }
};

// DELETE CHAT
export const deleteChat = async (req: AuthRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const chatId = req.params.chatId as string;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat ID.",
            });
        }

        const chat = await Chat.findOneAndDelete({
            _id: chatId,
            ownerId: userId,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found.",
            });
        }

        await Message.deleteMany({
            chatId: chat._id,
            ownerId: userId,
        });

        return res.status(200).json({
            success: true,
            message: "Chat deleted successfully.",
        });
    } catch (error) {
        console.error("DELETE CHAT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete chat.",
        });
    }
};

// RENAME CHAT
export const renameChat = async (req: AuthRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const chatId = req.params.chatId as string;
        const { title } = req.body;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat ID.",
            });
        }

        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 200
        ) {
            return res.status(400).json({
                success: false,
                message: "Title must be between 1 and 200 characters.",
            });
        }

        const chat = await Chat.findOneAndUpdate(
            {
                _id: chatId,
                ownerId: userId,
            },
            {
                $set: {
                    title: title.trim(),
                },
            },
            {
                new: true,
                runValidators: true,
            },
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Chat renamed successfully.",
            chat,
        });
    } catch (error) {
        console.error("RENAME CHAT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to rename chat.",
        });
    }
};

// TOGGLE PIN CHAT
export const togglePinChat = async (req: AuthRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        const chatId = req.params.chatId as string;
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid chat ID.",
            });
        }

        const chat = await Chat.findOne({
            _id: chatId,
            ownerId: userId,
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found.",
            });
        }

        chat.pinned = !chat.pinned;
        await chat.save();

        return res.status(200).json({
            success: true,
            message: chat.pinned
                ? "Chat pinned successfully."
                : "Chat unpinned successfully.",
            chat,
        });
    } catch (error) {
        console.error("TOGGLE PIN CHAT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update chat pin.",
        });
    }
};
