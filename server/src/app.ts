import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";

import authRouter from "./routes/auth.route.js";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.route.js";
import userRoutes from "./routes/user.routes.js";
import usageRoutes from "./routes/usage.routes.js";

const app = express();

const allowedOrigins = (
  process.env.CLIENT_URL || "https://docu-mind-ai-q4ya.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim());

// Clerk authentication middleware
app.use(
  clerkMiddleware({
    authorizedParties: allowedOrigins,
  })
);

// CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/documents", documentRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/api/usage", usageRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    message: "Hello from DocuMind AI!",
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error("Global error:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
);

export default app;