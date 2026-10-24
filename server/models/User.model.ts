
import mongoose, { Schema, Types } from "mongoose";

// 1. Define the User fields
interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  theme: "light" | "dark" | "system";
  dailyUsage: {
    questionsAsked: number;
    documentsUploaded: number;
    usageDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },

    dailyUsage: {
      questionsAsked: {
        type: Number,
        default: 0,
        min: 0,
      },

      documentsUploaded: {
        type: Number,
        default: 0,
        min: 0,
      },

      usageDate: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  },
);

// 3. Create the model
const User = mongoose.model<IUser>("User", userSchema);

export default User;
