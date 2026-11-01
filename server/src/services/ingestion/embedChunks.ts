import type { Types } from "mongoose";
import Chunk from "../../models/Chunks.model.js";
import { embedTexts, EMBEDDING_MODEL } from "../ai/gemini.js";

const BATCH_SIZE = 50;
const MAX_TRIES = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries temporary failures (rate limit, network) with waits of 2s, 4s, 8s
const embedWithRetry = async (texts: string[]): Promise<number[][]> => {
    for (let attempt = 1; ; attempt++) {
        try {
            return await embedTexts(texts);
        } catch (err) {
            if (attempt >= MAX_TRIES) throw err;
            await sleep(2000 * 2 ** (attempt - 1));
        }
    }
};

// Safe to run again: it only embeds chunks that do not have a vector yet,
// so a retry never creates duplicates and never repeats finished work.
export const embedDocumentChunks = async (
    documentId: Types.ObjectId
): Promise<number> => {
    const chunks = await Chunk.find({
        documentId,
        embeddingVector: { $exists: false },
    })
        .sort({ chunkIndex: 1 })
        .select("_id text");

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const vectors = await embedWithRetry(batch.map((c) => c.text));

        await Chunk.bulkWrite(
            batch.map((chunk, j) => ({
                updateOne: {
                    filter: { _id: chunk._id },
                    update: {
                        $set: {
                            embeddingVector: vectors[j],
                            embeddingModel: EMBEDDING_MODEL,
                        },
                    },
                },
            }))
        );

        await sleep(500); // small pause between batches to respect rate limits
    }

    return chunks.length;
};