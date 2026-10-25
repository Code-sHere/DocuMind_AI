import {Router} from "express";
import {register, login} from "../controllers/auth.controller.js";
import { authRateLimit } from "../middleware/authRateLimit.middleware.js";

const router = Router();

router.post("/register",authRateLimit, register);
router.post("/login",authRateLimit, login);

export default router;