import { Types } from "mongoose";
import { embedQuery } from "../services/ai/gemini.js";
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";


const MIN_SCORE = Number(process.env.RETRIEVAL_MIN_SCORE) || 0.7;

export type RetrievedChunk = {
    chunkId: string;
    documentId: string;
    documentName: string;
    pageNumber: number;
    text: string;
    score: number;
};

export const retrieveChunks = async(question: string, ownerId: string, documentIds: Types.ObjectId[], limit = 6): Promise<RetrievedChunk[]> => {
    const queryVector = await embedQuery(question);

    const rows = await Chunk.aggregate([
        {
            $vectorSearch: {
                index: "chunk_vector_index",
                path: "embeddingVector",
                queryVector,
                numCandidates: 100,
                limit,
                filter:{
                    ownerId: new Types.ObjectId(ownerId),
                    documentId: { $in: documentIds }
                }
            }
        },{
            $project:{
                documentId: 1,
                pageNumber: 1,
                text: 1,
                score: { $meta: "vectorSearchScore" }
            }
        }
    ]);

    const docs = await Document.find({_id: {$in:documentIds}}).select("originalFileName");
    const names = new Map(docs.map(doc => [doc._id.toString(), doc.originalFileName as string]));

    return rows
        .filter(row => row.score >= MIN_SCORE)
        .map(row => ({
            chunkId: row._id.toString(),
            documentId: row.documentId.toString(),
            documentName: names.get(row.documentId.toString()) || "Unknown",
            pageNumber: row.pageNumber,
            text: row.text,
            score: row.score
        }));
}
