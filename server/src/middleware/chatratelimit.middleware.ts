import rateLimit from "express-rate-limit";
 
// Every question costs money (AI call), so limit them per logged-in user.
export const chatRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 10,           // 10 questions per minute per user
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => req.userId ?? "anonymous", // runs after requireAuth
    message: {
        success: false,
        message: "You are asking too fast. Please wait a minute and try again.",
    },
});
 
