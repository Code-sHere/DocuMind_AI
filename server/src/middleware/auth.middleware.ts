import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.model.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
   
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Please sign in to continue",
      });
      return;
    }

    let user = await User.findOne({ clerkUserId: userId });

    
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);

      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      );

      const email = primaryEmail?.emailAddress.toLowerCase().trim();


      if (
        !email ||
        primaryEmail?.verification?.status !== "verified"
      ) {
        res.status(403).json({
          success: false,
          message: "A verified primary email is required",
        });
        return;
      }

      const name =
        [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "DocuMind User";


      user = await User.findOne({ email });

      if (user) {
        if (user.clerkUserId && user.clerkUserId !== userId) {
          res.status(409).json({
            success: false,
            message: "This email is linked to another account",
          });
          return;
        }

        user.clerkUserId = userId;
        await user.save();
      } else {
        user = await User.create({
          clerkUserId: userId,
          name,
          email,
        });
      }
    }

    req.userId = user._id.toString();

    next();
  } catch (error) {
    console.error("Clerk authentication failed:", error);

    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};