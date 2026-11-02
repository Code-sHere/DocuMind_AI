
import type { Request, Response } from "express";
import mongoose from "mongoose";

import Document from "../models/Documents.model.js";
import Chat from "../models/Chats.model.js";
import Message from "../models/Message.model.js";

import { answerQuestion } from "../services/chat/answerQuestion.js";

// ================= CONFIG =================

const MAX_DOCS_PER_CHAT = 10;
const MAX_QUESTION_LENGTH = 2000;

// Authenticated request type
interface AuthRequest extends Request {
    user: {
        _id: mongoose.Types.ObjectId;
    };
}

// ================= CREATE CHAT =================
// POST /api/chats
// Body: { documentIds: [], title?: string }

export const createChat = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { documentIds, title } = req.body;

        if (
            !Array.isArray(documentIds) ||
            documentIds.length === 0 ||
            documentIds.length > MAX_DOCS_PER_CHAT ||
            !documentIds.every(
                (id: unknown) =>
                    typeof id === "string" &&
                    mongoose.isValidObjectId(id)
            )
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_DOCUMENT_IDS",
            });
            return;
        }

        const uniqueIds = [...new Set(documentIds as string[])];

        // Verify document ownership and readiness
        const count = await Document.countDocuments({
            _id: { $in: uniqueIds },
            ownerId: req.user._id,
            status: "ready",
        });

        if (count !== uniqueIds.length) {
            res.status(400).json({
                success: false,
                message: "INVALID_DOCUMENT_IDS",
            });
            return;
        }

        const chat = await Chat.create({
            ownerId: req.user._id,
            documentIds: uniqueIds,
            title:
                typeof title === "string" && title.trim()
                    ? title.trim()
                    : "New Chat",
        });

        res.status(201).json({
            success: true,
            chat: {
                id: chat._id,
                title: chat.title,
                documentIds: chat.documentIds,
            },
        });
    } catch (error) {
        console.error("createChat failed:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create chat",
        });
    }
};

// ================= GET ALL CHATS =================
// GET /api/chats

export const getChats = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const chats = await Chat.find({
            ownerId: req.user._id,
        }).sort({
            pinned: -1,
            updatedAt: -1,
        });

        res.status(200).json({
            success: true,
            chats: chats.map((chat) => ({
                id: chat._id,
                title: chat.title,
                documentIds: chat.documentIds,
                pinned: chat.pinned,
                updatedAt: chat.updatedAt,
            })),
        });
    } catch (error) {
        console.error("getChats failed:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch chats",
        });
    }
};

// ================= GET CHAT MESSAGES =================
// GET /api/chats/:id/messages

export const getChatMessages = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: "INVALID_CHAT_ID",
            });
            return;
        }

        // Verify chat ownership
        const chat = await Chat.findOne({
            _id: id,
            ownerId: req.user._id,
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                message: "CHAT_NOT_FOUND",
            });
            return;
        }

        const messages = await Message.find({
            chatId: chat._id,
            ownerId: req.user._id,
        }).sort({ createdAt: 1 });

        // Collect unique cited document IDs
        const docIds = [
            ...new Set(
                messages.flatMap((message) =>
                    message.citations.map((citation) =>
                        citation.documentId.toString()
                    )
                )
            ),
        ];

        // Fetch document names
        const docs = await Document.find({
            _id: { $in: docIds },
            ownerId: req.user._id,
        }).select("originalFileName");

        const names = new Map(
            docs.map((doc) => [
                doc._id.toString(),
                doc.originalFileName,
            ])
        );

        res.status(200).json({
            success: true,
            messages: messages.map((message) => ({
                id: message._id,
                role: message.role,
                content: message.content,
                trustLevel: message.trustLevel,
                createdAt: message.createdAt,

                citations: message.citations.map((citation) => ({
                    documentId: citation.documentId,
                    documentName:
                        names.get(citation.documentId.toString()) ||
                        "Unknown",
                    chunkId: citation.chunkId,
                    pageNumber: citation.pageNumber,
                    excerpt: citation.excerpt,
                    relevanceScore: citation.relevanceScore,
                })),
            })),
        });
    } catch (error) {
        console.error("getChatMessages failed:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch chat messages",
        });
    }
};

// ================= SEND MESSAGE =================
// POST /api/chats/:id/messages
// Body: { content: "Your question" }

export const sendMessage = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id;
        const { content } = req.body;

        // Validate chat ID
        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid chat ID",
            });
            return;
        }

        // Validate question
        if (
            typeof content !== "string" ||
            !content.trim() ||
            content.trim().length > MAX_QUESTION_LENGTH
        ) {
            res.status(400).json({
                success: false,
                message: `Write a question of 1 to ${MAX_QUESTION_LENGTH} characters`,
            });
            return;
        }

        const question = content.trim();
        const userId = req.user._id;

        // 1. Verify chat ownership
        const chat = await Chat.findOne({
            _id: id,
            ownerId: userId,
        });

        if (!chat) {
            res.status(404).json({
                success: false,
                message: "Chat not found",
            });
            return;
        }

        // 2. Verify documents still exist and are ready
        const docs = await Document.find({
            _id: { $in: chat.documentIds },
            ownerId: userId,
            status: "ready",
        }).select("_id");

        if (docs.length === 0) {
            res.status(409).json({
                success: false,
                message: "The documents in this chat are no longer available",
            });
            return;
        }

        // 3. Get recent conversation history
        const recent = await Message.find({
            chatId: chat._id,
            ownerId: userId,
        })
            .sort({ createdAt: -1 })
            .limit(4);

        const history = recent.reverse().map((message) => ({
            role: message.role,
            content: message.content,
        }));

        // 4. Generate AI answer using RAG
        const result = await answerQuestion(
            question,
            userId.toString(),
            docs.map((doc) => doc._id),
            history
        );

        // 5. Save user message
        await Message.create({
            chatId: chat._id,
            ownerId: userId,
            role: "user",
            content: question,
            originalQuestion: question,
            citations: [],
        });

        // 6. Save assistant response
        const assistant = await Message.create({
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
            latencyMs: result.latencyMs,
            modelUsed: result.modelUsed,
        });

        // 7. Update chat title and activity
        if (chat.title === "New Chat") {
            chat.title = question.slice(0, 60);
        }

        chat.updatedAt = new Date();
        await chat.save();

        // 8. Send response
        res.status(200).json({
            success: true,
            message: {
                id: assistant._id,
                role: "assistant",
                content: result.content,
                trustLevel: result.trustLevel,
                citations: result.citations,
                createdAt: assistant.createdAt,
            },
        });
    } catch (error) {
        console.error("sendMessage failed:", error);

        const errorCode =
            error instanceof Error ? error.message : "";

        if (
            errorCode === "AI_TIMEOUT" ||
            errorCode === "AI_BAD_RESPONSE"
        ) {
            res.status(502).json({
                success: false,
                message: "The AI service did not answer. Please try again.",
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Unable to answer right now",
        });
    }
};
