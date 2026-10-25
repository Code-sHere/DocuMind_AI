import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const createToken = (userId: string) => {
    const secreat = process.env.JWT_SECRET;
    if (!secreat) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign({ userId }, secreat, { expiresIn: "1d" });
};

// Register 
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || password.length < 8 || password.length > 12) {
            res.status(400).json({
                success: false,
                message: "Provide a vaild name, email and password of 8-12 characters"
            });
            return;
        }

        const normalizesEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizesEmail });

        if (user) {
            res.status(409).json({
                success: false,
                message: "User already exists"
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            email: normalizesEmail,
            passwordHash
        });

        const token = createToken(newUser._id.toString());

        res.status(200).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                theme: newUser.theme
            }
        });

    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            res.status(409).json({
                success: false,
                message: "Email is already registered",
            });
            return;
        }
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

//Login

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" || !password) {
            res.status(400).json({
                success: false,
                message: "Provide a vaild email and password"
            });
            return;
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid password"
            });
            return;
        }

        const token = createToken(user._id.toString());

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                theme: user.theme
            }
        });

    } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({
            success: false,
            message: "Unable to log in",
        });
    }
}
