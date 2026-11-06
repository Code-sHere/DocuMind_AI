import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.route.js";
import userRoutes from "./routes/user.routes.js";
import usageRoutes from "./routes/usage.routes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/documents", documentRoutes);
app.use("/api/chats", chatRoutes);

// multer / baaki errors ke liye
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ message: err.message });
});


app.use("/api/user", userRoutes);
app.use("/api/usage", usageRoutes);

app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "healthy", message: "Hello from server!" });
});

app.use(
    (
        err: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        console.error("Global error:", err);

        res.status(400).json({
            success: false,
            message: err.message || "Something went wrong",
        });
    }
);


export default app;