import mongoose, { Schema, Types } from "mongoose";

type DocumentStatus = "uploaded" | "processing" | "ready" | "failed" | "deleting";

interface IDocument {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    workspaceId?: Types.ObjectId;

    displayName: string;
    originalFileName: string;
    mimeType: string;
    storageKey: string;

    fileSize: number;
    pageCount: number;

    status: DocumentStatus;
    errorCode?: string;
    chunkCount: number;

    embeddingModelName?: string;
    embeddingModelVersion?: string;

    summary?: {
        text: string;
        version: number;
        generatedAt: Date;
    }

    topics: string[];
    collectionIds: Types.ObjectId[];

    createdAt: Date;
    updatedAt: Date;
}

const documentSchema = new Schema<IDocument>({
    ownerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
        index: true,
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        required: false,
        default: null,
    },

    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    originalFileName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    mimeType: {
        type: String,
        required: true,
        enum: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ]
    },
    storageKey: {
        type: String,
        required: true,
        select: false,
    },

    fileSize: {
        type: Number,
        required: true,
        min:1,
    },
    pageCount: {
        type: Number,
        default:0,
        min:0,
    },

    status: {
        type: String,
        required: true,
        enum:["uploaded", "processing", "ready", "failed", "deleting"],
        default:"uploaded",
        index: true,
    },
    errorCode: {
        type: String,
        required: false,
        trim: true,
        maxlength: 200,
    },
    chunkCount: {
        type: Number,
        default: 0,
        min:0,
    },

    embeddingModelName: {
        type: String,
        required: false,
    },
    embeddingModelVersion: {
        type: String,
        required: false,
    },

    summary: {
        text: {
            type: String,
            required: false,
            maxlength: 2000,
        },
        version: {
            type: Number,
            default: 1,
            required: false,
        },
        generatedAt: {
            type: Date,
            required: false,
        }
    },

    topics: {
        type: [String],
        default:[],
    },

    collectionIds: {
        type: [Schema.Types.ObjectId],
        ref:"Collection",
        default:[],
        required: false,
    },

    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
})

documentSchema.index({ ownerId: 1, workspaceId: 1, displayName: 1 }, { unique: true });

export default mongoose.model<IDocument>("Document", documentSchema);