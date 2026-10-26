import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({ success: false, message: "Please log in" });
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not defined");
        res.status(500).json({ success: false, message: "Server configuration error" });
        return;
    }

    try {
        const payload = jwt.verify(token, secret);

        if (typeof payload === "string" || typeof payload.userId !== "string") {
            res.status(401).json({ success: false, message: "Invalid session" });
            return;
        }

        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ success: false, message: "Session expired. Please log in again" });
    }
};