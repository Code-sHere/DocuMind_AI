import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.route.js";


const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);

app.get("/api/health", (req, res) => {
    res.json({success: true, status:"healthy", message: "Hello from server!" });
});

export default app;