import { Types } from "mongoose";
import { embedQuery } from "../services/ai/gemini.js";
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";

// Lowered from 0.7: short questions like "summarize this" score low.
const MIN_SCORE = Number(process.env.RETRIEVAL_MIN_SCORE) || 0.5;

// Llama 3.1 8B on Cloudflare has a small context window (~8k tokens).
// Keep the amount of document text we send small.
const OVERVIEW_TOTAL_CHUNKS = 5;
const FALLBACK_TOP_K = 3;
// Documents this small are sent to the model in full.
const SMALL_DOC_MAX_CHUNKS = 6;

export type RetrievedChunk = {
    chunkId: string;
    documentId: string;
    documentName: string;
    pageNumber: number;
    text: string;
    score: number;
};

// "summarize this", "what is in this pdf", "ees document mai kiya hai", etc.
// These questions have no topic words, so vector search cannot work for them.
const OVERVIEW_REGEX =
    /summar|overview|heading|title|topics?|sections?|outline|structure|contents?|\b(this|the|my) (pdf|document|file|doc)\b|main points?|key points?|points on|about (this|the|his|her|that|it)\b|tell me about|what('?s| is| are)? (in|inside|this|the)|explain (this|the)|kya hai|kiya hai|kya likha|batao|bataiye|samjha|saransh/i;

export const isOverviewQuestion = (question: string): boolean =>
    OVERVIEW_REGEX.test(question);

const getNames = async (documentIds: Types.ObjectId[]) => {
    const docs = await Document.find({ _id: { $in: documentIds } }).select(
        "originalFileName"
    );
    return new Map(
        docs.map((doc) => [doc._id.toString(), doc.originalFileName as string])
    );
};

// No embeddings needed: take the first chunks of each selected document.
const getOpeningChunks = async (
    ownerId: string,
    documentIds: Types.ObjectId[],
    total = OVERVIEW_TOTAL_CHUNKS
): Promise<RetrievedChunk[]> => {
    const names = await getNames(documentIds);
    const perDoc = Math.max(1, Math.floor(total / documentIds.length));
    const result: RetrievedChunk[] = [];

    for (const documentId of documentIds) {
        const rows = await Chunk.find({
            ownerId: new Types.ObjectId(ownerId),
            documentId,
        })
            .sort({ chunkIndex: 1 })
            .limit(perDoc)
            .select("_id documentId pageNumber text");

        for (const row of rows) {
            result.push({
                chunkId: row._id.toString(),
                documentId: row.documentId.toString(),
                documentName: names.get(row.documentId.toString()) || "Unknown",
                pageNumber: row.pageNumber,
                text: row.text,
                score: 1, // direct read, not a similarity score
            });
        }
    }

    return result;
};

export const retrieveChunks = async (
    question: string,
    ownerId: string,
    documentIds: Types.ObjectId[],
    limit = 4
): Promise<RetrievedChunk[]> => {
    // 0. Small document(s): no retrieval needed, send everything.
    const totalChunks = await Chunk.countDocuments({
        ownerId: new Types.ObjectId(ownerId),
        documentId: { $in: documentIds },
    });

    if (totalChunks > 0 && totalChunks <= SMALL_DOC_MAX_CHUNKS) {
        console.log(`[retrieve] small document, sending all ${totalChunks} chunks`);
        return getOpeningChunks(
            ownerId,
            documentIds,
            SMALL_DOC_MAX_CHUNKS * documentIds.length
        );
    }

    // 1. Overview / vague questions -> read the document directly.
    if (isOverviewQuestion(question)) {
        const opening = await getOpeningChunks(ownerId, documentIds);
        console.log(`[retrieve] overview mode, chunks: ${opening.length}`);
        if (opening.length > 0) return opening;
    }

    // 2. Normal vector search.
    const queryVector = await embedQuery(question);

    const rows = await Chunk.aggregate([
        {
            $vectorSearch: {
                index: "chunk_vector_index",
                path: "embeddingVector",
                queryVector,
                numCandidates: 100,
                limit,
                filter: {
                    ownerId: new Types.ObjectId(ownerId),
                    documentId: { $in: documentIds },
                },
            },
        },
        {
            $project: {
                documentId: 1,
                pageNumber: 1,
                text: 1,
                score: { $meta: "vectorSearchScore" },
            },
        },
    ]);

    console.log(
        `[retrieve] vector rows: ${rows.length}, scores:`,
        rows.map((r) => Number(r.score).toFixed(3))
    );

    // Index missing / filter fields not declared -> zero rows, no error.
    if (rows.length === 0) {
        console.warn(
            "[retrieve] $vectorSearch returned 0 rows. Check the Atlas index " +
                "'chunk_vector_index' (768 dims, cosine, filter fields ownerId + documentId). " +
                "Falling back to opening chunks."
        );
        return getOpeningChunks(ownerId, documentIds);
    }

    const names = await getNames(documentIds);

    let kept = rows.filter((row) => row.score >= MIN_SCORE);

    // Scores exist but all are under the threshold: still give the best few
    // to the model and let it decide, instead of a hard "not found".
    if (kept.length === 0) kept = rows.slice(0, FALLBACK_TOP_K);

    return kept.map((row) => ({
        chunkId: row._id.toString(),
        documentId: row.documentId.toString(),
        documentName: names.get(row.documentId.toString()) || "Unknown",
        pageNumber: row.pageNumber,
        text: row.text,
        score: row.score,
    }));
};
