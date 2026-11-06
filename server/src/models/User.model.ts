import mongoose, { Schema, Types } from "mongoose";

interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  theme: "ember" | "emerald" | "daylight";
  stats: {
    totalQuestionsAsked: number;
    totalDocumentsUploaded: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    lastQuestionAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    theme: {
      type: String,
      enum: ["ember", "emerald", "daylight"],
      default: "ember",
    },

    // Lifetime stats (kabhi reset nahi hote)
    stats: {
      totalQuestionsAsked: { type: Number, default: 0, min: 0 },
      totalDocumentsUploaded: { type: Number, default: 0, min: 0 },
      totalInputTokens: { type: Number, default: 0, min: 0 },
      totalOutputTokens: { type: Number, default: 0, min: 0 },
      lastQuestionAt: { type: Date },
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;