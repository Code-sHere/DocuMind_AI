import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadDocumnets, deleteDocument } from "../controllers/documnetController.js";

const router = Router();

router.post("/upload", upload.array("files", 5), uploadDocumnets);
router.delete("/", deleteDocument);

export default router;