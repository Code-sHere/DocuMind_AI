
import mongoose, { Schema, Types } from "mongoose";

interface IMessage {
  chatId: Types.ObjectId;
  ownerId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  originalQuestion?: string;
  rewrittenSearchQuery?: string;
  trustLevel?: "strong" | "partial" | "not_found";
  citations: {
    documentId: Types.ObjectId;
    chunkId: Types.ObjectId;
    pageNumber: number;
    excerpt: string;
    relevanceScore: number;
  }[];
  feedback?: "up" | "down";
  tokenUsage?: {
    input: number;
    output: number;
  };
  latencyMs?: number;
  modelUsed?: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  originalQuestion: String,
  rewrittenSearchQuery: String,
  trustLevel: {
    type: String,
    enum: ["strong", "partial", "not_found"],
  },
  citations: [{
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    chunkId: {
      type: Schema.Types.ObjectId,
      ref: "Chunk",
      required: true,
    },
    pageNumber: { type: Number, required: true },
    excerpt: { type: String, required: true },
    relevanceScore: { type: Number, required: true },
  }],
  feedback: {
    type: String,
    enum: ["up", "down"],
  },
  tokenUsage: {
    input: { type: Number, min: 0 },
    output: { type: Number, min: 0 },
  },
  latencyMs: { type: Number, min: 0 },
  modelUsed: String,
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ chatId: 1, createdAt: 1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
