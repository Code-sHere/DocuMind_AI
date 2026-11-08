import { Router } from "express";
import { getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();


router.get("/me", requireAuth, getMe);

export default router;