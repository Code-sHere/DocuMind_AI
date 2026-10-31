import { Request, Response } from "express";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js"
import mongoose from "mongoose";
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";
import { extractText } from "../utils/extractText.js";
import { chunkText } from "../utils/chunkText.js";


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

        if (!files) return res.status(400).json({ success: false, message: "No file uploaded" });

        const results = [];

        if (!req.userId) return res.status(400).json({ success: false, message: "User not found" });

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
                const text = await extractText(file.buffer, file.mimetype);
                if (!text.trim()) throw new Error("EMPTY_TEXT");

                const chunks = chunkText(text);

                await Chunk.insertMany(
                    chunks.map((content, i) => ({
                        ownerId: doc.ownerId,
                        documentId: doc._id,
                        chunkIndex: i,
                        pageNumber: 1,
                        text: content,                              // field ka naam "text" hai
                        tokenCount: Math.ceil(content.length / 4),  // approx
                    }))
                );

                doc.extractedText = text;
                doc.chunkCount = chunks.length;
                doc.status = "ready";
                await doc.save();
            } catch (e) {
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

export const listDocuments = async(req: Request, res: Response): Promise<void> => {
    try{
        const docs = await Document.find({ ownerId: req.userId }).sort({ createdAt: -1 }).select("originalFileName fileSize status chunkCount createdAt");

        res.status(200).json({
            success:true,
            documents: docs.map((d)=>({
                id: d._id,
                filename: d.originalFileName,
                size: d.fileSize,
                status: d.status,
                chunkCount: d.chunkCount,
                createdAt: d.createdAt
            }))
        })
    }catch(error){
        console.error("listDocuments failed:", error);
        res.status(500).json({ success: false, message: "Unable to list documents" });
    }
}