
import { Router, type RequestHandler } from "express";

import {
    createChat,
    getChats,
    getChatMessages,
    sendMessage,
} from "../controllers/chat.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { chatRateLimit } from "../middleware/chatratelimit.middleware.js";

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

// Create a new chat
router.post("/", createChat as unknown as RequestHandler);

// Get all chats
router.get("/", getChats as unknown as RequestHandler);

// Get messages of a particular chat
router.get("/:id/messages", getChatMessages as unknown as RequestHandler);

// Send a message
router.post("/:id/messages", chatRateLimit, sendMessage as unknown as RequestHandler);

export default router;
