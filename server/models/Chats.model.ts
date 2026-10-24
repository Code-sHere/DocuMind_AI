
import mongoose, { Schema, Types } from "mongoose";

interface IChat {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  documentIds: Types.ObjectId[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "New chat",
    },

    documentIds: {
      type: [Schema.Types.ObjectId],
      ref: "Document",
      required: true,
      default: [],
    },

    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Efficiently retrieve a user's chats, newest first
chatSchema.index({ ownerId: 1, updatedAt: -1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
