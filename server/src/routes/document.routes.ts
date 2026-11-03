import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadDocumnets, deleteDocument, listDocuments, getDocumentById, renameDocument, retryDocument } from "../controllers/documnet.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listDocuments);
router.post("/upload",requireAuth, upload.array("files", 5), uploadDocumnets);
router.get("/:id",requireAuth, getDocumentById);
router.patch("/:id",requireAuth,renameDocument);
router.post("/:id/retry",requireAuth, retryDocument);
router.delete("/:id",requireAuth, deleteDocument);

export default router;