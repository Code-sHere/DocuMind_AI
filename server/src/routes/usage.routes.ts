
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { getDailyUsage } from "../controllers/usage.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getDailyUsage);

export default router;
