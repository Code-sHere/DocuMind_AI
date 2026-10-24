
import mongoose, { Schema, Types } from "mongoose";

interface IStudySet {
  ownerId: Types.ObjectId;
  documentId: Types.ObjectId;
  type: "quiz" | "flashcards";
  items: {
    question: string;
    answer: string;
    sourceChunkId: Types.ObjectId;
  }[];
  scoreHistory: {
    score: number;
    total: number;
    attemptedAt: Date;
  }[];
  createdAt: Date;
}

const studySetSchema = new Schema<IStudySet>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  documentId: {
    type: Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  type: {
    type: String,
    enum: ["quiz", "flashcards"],
    required: true,
  },
  items: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    sourceChunkId: {
      type: Schema.Types.ObjectId,
      ref: "Chunk",
      required: true,
    },
  }],
  scoreHistory: [{
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    attemptedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

const StudySet = mongoose.model<IStudySet>(
  "StudySet",
  studySetSchema,
);

export default StudySet;
