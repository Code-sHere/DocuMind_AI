
import mongoose, { Schema, Types } from "mongoose";

interface ISession {
  userId: Types.ObjectId;
  deviceInfo?: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  deviceInfo: {
    type: String,
    maxlength: 500,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model<ISession>("Session", sessionSchema);

export default Session;
