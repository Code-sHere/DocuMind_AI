import { Request, Response } from "express";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js"
import mongoose from "mongoose";
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";
import { extractText } from "../utils/extractText.js";
import { chunkPages } from "../utils/chunkText.js";
import { embedDocumentChunks } from "../services/ingestion/embedChunks.js";


const uploadToCloudinary = (
    buffer: Buffer,
    originalName: string
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "dashboard_documents",
                resource_type: "raw",
                public_id: `${Date.now()}-${originalName}`,
            },
            (error, result) => {
                if (error || !result) return reject(error ?? new Error("Upload fail"));
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

export const uploadDocumnets = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[] | undefined;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        if (!req.userId) return res.status(400).json({ success: false, message: "User not found" });

        const results = [];

        for (const file of files) {
            const uploaded = await uploadToCloudinary(file.buffer, file.originalname);

            const doc = await Document.create({
                ownerId: req.userId,
                displayName: file.originalname,
                originalFileName: file.originalname,
                mimeType: file.mimetype,
                storageKey: uploaded.public_id,
                fileUrl: uploaded.secure_url,
                fileSize: file.size,
                status: "processing",
            });

            try {
                // 1. Text, page by page
                const pages = await extractText(file.buffer, file.mimetype);

                console.log("Pages extracted:", pages.length);

                const text = pages.map((p) => p.text).filter(Boolean).
                join("\n");

                console.log("Text extracted:", text.length);

                if (!text.trim()) throw new Error("EMPTY_TEXT");

                // 2. Chunks that remember their real page number
                const chunks = chunkPages(pages);

                console.log("Chunks created:", chunks.length);

                if (chunks.length === 0) throw new Error("EMPTY_TEXT");

                await Chunk.insertMany(
                    chunks.map((chunk, i) => ({
                        ownerId: doc.ownerId,
                        documentId: doc._id,
                        chunkIndex: i,
                        pageNumber: chunk.pageNumber,
                        text: chunk.text,
                        tokenCount: Math.ceil(chunk.text.length / 4), // approx
                    }))
                );

                // 3. Embeddings (vectors) for every chunk
                await embedDocumentChunks(doc._id);

                doc.extractedText = text;
                doc.chunkCount = chunks.length;
                doc.pageCount = pages.length;
                doc.status = "ready"; // ready only after embeddings are saved
                await doc.save();
            } catch (e) {
                console.error("Processing failed:", e);
                doc.status = "failed";
                doc.errorCode = e instanceof Error ? e.message : "PROCESSING_ERROR";
                await doc.save();
            }

            results.push({
                id: doc._id,
                filename: doc.originalFileName,
                url: doc.fileUrl,
                size: doc.fileSize,
                status: doc.status,
                chunkCount: doc.chunkCount,
            });
        }

        return res.status(200).json({ success: true, results });

    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(err);
        return res.status(500).json({ message: "Upload fail", error: message });
    }
}

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ success: false, message: "Invalid document id" });
            return;
        }

        // sirf apni file milegi (ownerId check), storageKey select:false hai isliye +
        const doc = await Document.findOne({ _id: id, ownerId: req.userId }).select("+storageKey");

        if (!doc) {
            res.status(404).json({ success: false, message: "Document not found" });
            return;
        }

        // delete shuru hone ka marker, taaki beech mein fail ho to pata chale
        doc.status = "deleting";
        await doc.save();

        // 1. Cloudinary se file hatao
        const result = await cloudinary.uploader.destroy(doc.storageKey, {
            resource_type: "raw",
        });
        if (result.result !== "ok" && result.result !== "not found") {
            throw new Error(`Cloudinary delete failed: ${result.result}`);
        }

        // 2. Chunks hatao
        await Chunk.deleteMany({ documentId: doc._id });

        // 3. Document hatao
        await doc.deleteOne();

        res.status(200).json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
        console.error("deleteDocument failed:", error);
        res.status(500).json({ success: false, message: "Unable to delete document" });
    }
};

export const listDocuments = async (req: Request, res: Response): Promise<void> => {
    try {

        const userId = req.userId;

        if (!userId) {
            res.status(400).json({ success: false, message: "User not found" });
            return;
        }

        // Read query parameters
        const q = String(req.query.q ?? "").trim();
        const status = String(req.query.status ?? "all");
        const sort = String(req.query.sort ?? "newest");

        // validate pagination
        const page = Math.max(
            1,
            Number.parseInt(String(req.query.page ?? "1"), 10) || 1
        );
        const limit = Math.min(
            100,
            Math.max(
                1,
                Number.parseInt(String(req.query.limit ?? "12"), 10) || 12
            )
        );

        // validate status 
        const allowedStatus = ["all", "ready", "processing", "failed"];

        if (!allowedStatus.includes(status)) {
            res.status(400).json({ success: false, message: "Invalid status" });
            return;
        }

        // validate sorting
        const sortOptions: Record<string, Record<string, 1 | -1>> = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            name: { displayName: -1 },
            size: { fileSize: 1 }
        }

        if (!sortOptions[sort]) {
            res.status(400).json({ success: false, message: "Invalid sort" });
            return;
        }

        // build mongodb query
        const filter: Record<string, unknown> = {
            ownerId: userId,
        };

        if (status !== "all") {
            filter.status = status;
        }

        // escape regex character so search is literal
        if (q) {
            const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.displayName = {
                $regex: escapedQuery,
                $options: "i"
            };
        }

        // count matching documents
        const total = await Document.countDocuments(filter);

        // fetch current page
        const documents = await Document.find(filter)
            .select(
                "displayName originalFileName mimeType fileSize status errorCode chunkCount pageCount createdAt"
            )
            .sort(sortOptions[sort])
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();


        res.status(200).json({
            success: true,
            documents: documents.map((doc) => ({
                id: doc._id.toString(),
                displayName: doc.displayName,
                mimeType: doc.mimeType,
                fileSize: doc.fileSize,
                status: doc.status,
                errorCode: doc.errorCode ?? null,
                chunkCount: doc.chunkCount ?? 0,
                pageCount: doc.pageCount ?? 0,
                createdAt: doc.createdAt
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("listDocuments failed:", error);
        res.status(500).json({ success: false, message: "Unable to list documents" });
    }
}


// GET /api/documents/:id
// Fetch one document belonging to the logged-in user.

export const getDocumentById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: "INVALID_DOCUMENT_ID",
            });
            return;
        }

        const doc = await Document.findOne({
            _id: id,
            ownerId: req.userId,
        }).select(
            "displayName originalFileName mimeType fileSize status errorCode chunkCount pageCount createdAt"
        );

        if (!doc) {
            res.status(404).json({
                success: false,
                message: "DOCUMENT_NOT_FOUND",
            });
            return;
        }

        res.status(200).json({
            success: true,
            document: {
                id: doc._id.toString(),
                displayName: doc.displayName,
                originalFileName: doc.originalFileName,
                mimeType: doc.mimeType,
                size: doc.fileSize,
                status: doc.status,
                errorCode: doc.errorCode ?? null,
                chunkCount: doc.chunkCount ?? 0,
                pageCount: doc.pageCount ?? 0,
                createdAt: doc.createdAt,
            },
        });
    } catch (error) {
        console.error("getDocumentById failed:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch document",
        });
    }
};

export const renameDocument = async (req: Request, res: Response): Promise<void> => {
    try {

        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({ success: false, message: "Invalid document id" });
            return;
        }

        const { displayName } = req.body;

        if (
            typeof displayName !== "string" ||
            displayName.trim().length < 1 ||
            displayName.trim().length > 100
        ) {
            res.status(400).json({
                success: false,
                message: "Display name must contain 1 to 100 characters",
            });
            return;
        }

        const doc = await Document.findOneAndUpdate({
            _id: id,
            ownerId: req.userId,
        }, {
            $set: {
                displayName: displayName.trim(),
            }
        }, {
            new: true,
            runValidators: true,
        }).select(
            "displayName originalFileName mimeType fileSize status errorCode chunkCount pageCount createdAt"
        );

        if (!doc) {
            res.status(404).json({ success: false, message: "Document not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Document renamed successfully",
            document: {
                id: doc._id.toString(),
                displayName: doc.displayName,
                originalFileName: doc.originalFileName,
            }
        })

    } catch (error) {
        console.error("renameDocument failed:", error);

        res.status(500).json({
            success: false,
            message: "Unable to rename document",
        });
    }
}


// this code suggest by ai 😜

export const retryDocument = async (
    req: Request,
    res: Response
): Promise<void> => {
    let claimedDocument: any = null;

    try {
        const id = req.params.id;

        // 1. Validate document ID
        if (!mongoose.isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: "INVALID_DOCUMENT_ID",
            });
            return;
        }

        // 2. Find user's document
        const doc = await Document.findOne({
            _id: id,
            ownerId: req.userId,
        }).select("+storageKey");

        if (!doc) {
            res.status(404).json({
                success: false,
                message: "DOCUMENT_NOT_FOUND",
            });
            return;
        }

        if (doc.status !== "failed") {
            res.status(409).json({
                success: false,
                message: "DOCUMENT_NOT_FAILED",
            });
            return;
        }

        // 3. Claim document atomically
        claimedDocument = await Document.findOneAndUpdate(
            {
                _id: doc._id,
                ownerId: req.userId,
                status: "failed",
            },
            {
                $set: { status: "processing" },
                $unset: { errorCode: 1 },
            },
            { new: true }
        ).select("+storageKey");

        if (!claimedDocument) {
            res.status(409).json({
                success: false,
                message: "DOCUMENT_ALREADY_PROCESSING",
            });
            return;
        }

        // 4. Download original PDF from Cloudinary
        const fileUrl = cloudinary.utils.private_download_url(
            claimedDocument.storageKey,
            "raw",
            {
                expires_at: Math.floor(Date.now() / 1000) + 3600,
            }
        );

        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error("CLOUDINARY_DOWNLOAD_FAILED");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 5. Extract text
        const pages = await extractText(
            buffer,
            claimedDocument.mimeType
        );

        const text = pages
            .map((page) => page.text)
            .filter(Boolean)
            .join("\n\n");

        if (!text.trim()) {
            throw new Error("EMPTY_TEXT");
        }

        // 6. Remove old chunks before rebuilding
        await Chunk.deleteMany({
            documentId: claimedDocument._id,
            ownerId: req.userId,
        });

        // 7. Generate fresh chunks
        const chunks = chunkPages(pages);

        if (!chunks.length) {
            throw new Error("NO_CHUNKS_GENERATED");
        }

        await Chunk.insertMany(
            chunks.map((chunk, index) => ({
                ownerId: claimedDocument.ownerId,
                documentId: claimedDocument._id,
                chunkIndex: index,
                pageNumber: chunk.pageNumber,
                text: chunk.text,
                tokenCount: Math.ceil(chunk.text.length / 4),
            }))
        );

        // 8. Generate embeddings
        await embedDocumentChunks(claimedDocument._id);

        // 9. Verify embeddings
        const totalChunks = await Chunk.countDocuments({
            documentId: claimedDocument._id,
            ownerId: req.userId,
        });

        const missingEmbeddings = await Chunk.countDocuments({
            documentId: claimedDocument._id,
            ownerId: req.userId,
            $or: [
                { embeddingVector: { $exists: false } },
                { embeddingVector: null },
                { embeddingVector: { $size: 0 } },
            ],
        });

        if (totalChunks === 0 || missingEmbeddings > 0) {
            throw new Error("EMBEDDINGS_INCOMPLETE");
        }

        // 10. Mark document ready
        claimedDocument.extractedText = text;
        claimedDocument.pageCount = pages.length;
        claimedDocument.chunkCount = totalChunks;
        claimedDocument.status = "ready";
        claimedDocument.errorCode = undefined;

        await claimedDocument.save();

        res.status(200).json({
            success: true,
            message: "DOCUMENT_REPROCESSED_SUCCESSFULLY",
            document: {
                id: claimedDocument._id,
                filename: claimedDocument.originalFileName,
                status: "ready",
                pageCount: pages.length,
                chunkCount: totalChunks,
            },
        });

    } catch (error) {
        console.error("retryDocument failed:", error);

        if (claimedDocument) {
            claimedDocument.status = "failed";
            claimedDocument.errorCode =
                error instanceof Error
                    ? error.message.slice(0, 200)
                    : "REPROCESSING_FAILED";

            await claimedDocument.save();
        }

        res.status(500).json({
            success: false,
            message: "DOCUMENT_REPROCESSING_FAILED",
            error:
                error instanceof Error
                    ? error.message
                    : "UNKNOWN_ERROR",
        });
    }
};

