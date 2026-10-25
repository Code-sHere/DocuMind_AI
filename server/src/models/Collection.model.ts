
import mongoose, { Schema, Types } from "mongoose";

interface ICollection {
  ownerId: Types.ObjectId;
  name: string;
  colour: string;
  createdAt: Date;
}

const collectionSchema = new Schema<ICollection>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  colour: {
    type: String,
    default: "#6366f1",
    match: /^#[0-9A-Fa-f]{6}$/,
  },
  createdAt: { type: Date, default: Date.now },
});

collectionSchema.index({ ownerId: 1, name: 1 });

const Collection = mongoose.model<ICollection>(
  "Collection",
  collectionSchema,
);

export default Collection;
