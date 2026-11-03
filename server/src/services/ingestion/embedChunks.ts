
import type { Types } from "mongoose";
import Chunk from "../../models/Chunks.model.js";
import { embedTexts, EMBEDDING_MODEL } from "../ai/gemini.js";

const BATCH_SIZE = 50;
const MAX_TRIES = 4;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Identify chunks without a usable embedding
const missingEmbeddingQuery = {
  $or: [
    { embeddingVector: { $exists: false } },
    { embeddingVector: null },
    { embeddingVector: { $size: 0 } },
  ],
};

// Retry temporary Gemini failures
const embedWithRetry = async (
  texts: string[]
): Promise<number[][]> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await embedTexts(texts);
    } catch (error) {
      if (attempt >= MAX_TRIES) {
        throw error;
      }

      await sleep(2000 * 2 ** (attempt - 1));
    }
  }
};

// Embed only chunks whose embeddings are missing.
// Already completed chunks are not embedded again.
export const embedDocumentChunks = async (
  documentId: Types.ObjectId
): Promise<number> => {

  const chunks = await Chunk.find({
    documentId,
    ...missingEmbeddingQuery,
  })
    .sort({ chunkIndex: 1 })
    .select("_id text");

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const vectors = await embedWithRetry(
      batch.map((chunk) => chunk.text)
    );

    // Validate the embedding response before saving
    if (
      vectors.length !== batch.length ||
      vectors.some(
        (vector) =>
          !Array.isArray(vector) ||
          vector.length === 0 ||
          vector.some((value) => !Number.isFinite(value))
      )
    ) {
      throw new Error("INVALID_EMBEDDING_RESPONSE");
    }

    await Chunk.bulkWrite(
      batch.map((chunk, index) => ({
        updateOne: {
          filter: {
            _id: chunk._id,
            ...missingEmbeddingQuery,
          },
          update: {
            $set: {
              embeddingVector: vectors[index],
              embeddingModel: EMBEDDING_MODEL,
            },
          },
        },
      }))
    );

    // Small delay between batches
    await sleep(500);
  }

  return chunks.length;
};
