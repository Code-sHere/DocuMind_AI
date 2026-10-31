import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadDocumnets, deleteDocument, listDocuments } from "../controllers/documnet.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listDocuments);
router.post("/upload",requireAuth, upload.array("files", 5), uploadDocumnets);
router.delete("/:id",requireAuth, deleteDocument);

export default router;