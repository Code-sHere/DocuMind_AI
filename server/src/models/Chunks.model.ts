import mongoose, { Schema, Types } from "mongoose";

interface IChunk {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    documentId: Types.ObjectId;
    chunkIndex: number;
    pageNumber: number;
    sectionTitle?: string;
    text: string;
    tokenCount: number;
    embeddingVector: number[];
    embeddingModel: string;
    createdAt: Date;
}

const chunkSchema = new Schema<IChunk>({
    ownerId: { type: Types.ObjectId, required: true, ref: "User" },
    documentId: { type: Types.ObjectId, required: true, ref: "Document" },
    chunkIndex: { type: Number, required: true, min: 0 },
    pageNumber: { type: Number, required: true, min: 1 },
    sectionTitle: { type: String, required: true },
    text: { type: String, required: true },
    tokenCount: { type: Number, required: true, min: 0 },
    embeddingVector: { type: [Number], required: true },
    embeddingModel: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

chunkSchema.index(
    { documentId: 1, chunkIndex: 1 },
    { unique: true },
);

const Chunk = mongoose.model<IChunk>("Chunk", chunkSchema);

export default Chunk;
