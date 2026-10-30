import { Request, Response } from "express";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js"

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

        for (const file of files) {
            const uploaded = await uploadToCloudinary(file.buffer, file.originalname);

            results.push({
                filename: file.originalname,
                size: file.size,
                url: uploaded.secure_url,
                public_id: uploaded.public_id,
                status: "success"
            })
        }

        return res.status(200).json({ success: true, results });

    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(err);
        return res.status(500).json({ message: "Upload fail", error: message });
    }
}

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { public_id } = req.body as { public_id?: string };
        if (!public_id) {
            return res.status(400).json({ message: "public_id chahiye" });
        }
        await cloudinary.uploader.destroy(public_id, { resource_type: "raw" });
        return res.json({ message: "File delete ho gayi" });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return res.status(500).json({ message });
    }
};