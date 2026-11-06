
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";

import {
    updateProfile,
    updateTheme,
    changePassword,
    exportUserData,
    deleteAccount,
} from "../controllers/user.controller.js";

const router = Router();

// All user settings routes require authentication.
router.use(requireAuth);

router.patch("/profile", updateProfile);

router.patch("/theme", updateTheme);

router.post("/change-password", changePassword);

router.get("/export", exportUserData);

router.delete("/account", deleteAccount);

export default router;
