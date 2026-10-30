import "dotenv/config";
import express,{ Request, Response, NextFunction} from "express";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import documentRoutes from "./routes/document.routes.js";

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

// multer / baaki errors ke liye
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

app.get("/api/health", (req, res) => {
    res.json({success: true, status:"healthy", message: "Hello from server!" });
});

export default app;