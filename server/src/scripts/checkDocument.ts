// Usage:
//   npx tsx src/scripts/checkDocument.ts <documentId>
//   npx tsx src/scripts/checkDocument.ts <documentId> "your question here"
//
// Part 1 checks what is saved in MongoDB. Part 2 (only if you pass a question)
// runs a real vector search, the same one the chat will use later.

import "dotenv/config";
import mongoose, { Types } from "mongoose";
import Document from "../models/Documents.model.js";
import Chunk from "../models/Chunks.model.js";
import { embedQuery } from "../services/ai/gemini.js";

const ok = (label: string, pass: boolean, detail = "") =>
    console.log(`${pass ? "PASS" : "FAIL"}  ${label}${detail ? "  ->  " + detail : ""}`);

const run = async () => {
    const [documentId, question] = process.argv.slice(2);

    if (!documentId || !mongoose.isValidObjectId(documentId)) {
        console.log('Give a valid document id: npx tsx src/scripts/checkDocument.ts <documentId> "question"');
        return;
    }

    const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;
    if (!uri) {
        console.log("FAIL  MONGODB_URI (or MONGO_URI) is missing in .env");
        return;
    }
    await mongoose.connect(uri);

    const docId = new Types.ObjectId(documentId);
    const expectedDims = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);

    // ---------- Part 1: what is saved ----------
    const doc = await Document.findById(docId);
    if (!doc) {
        console.log("FAIL  Document not found");
        return;
    }
    console.log(`\nDocument: ${doc.originalFileName}`);
    ok("Status is ready", doc.status === "ready", `status = ${doc.status}${doc.errorCode ? ", error = " + doc.errorCode : ""}`);

    const [stats] = await Chunk.aggregate([
        { $match: { documentId: docId } },
        {
            $project: {
                pageNumber: 1,
                embeddingModel: 1,
                len: { $strLenCP: "$text" },
                dims: { $size: { $ifNull: ["$embeddingVector", []] } },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                withVector: { $sum: { $cond: [{ $gt: ["$dims", 0] }, 1, 0] } },
                dims: { $addToSet: "$dims" },
                models: { $addToSet: "$embeddingModel" },
                pages: { $addToSet: "$pageNumber" },
                minLen: { $min: "$len" },
                maxLen: { $max: "$len" },
                avgLen: { $avg: "$len" },
            },
        },
    ]);

    if (!stats) {
        console.log("FAIL  No chunks found for this document");
        return;
    }

    const pages = [...stats.pages].sort((a: number, b: number) => a - b);
    ok("Chunks exist", stats.total > 0, `${stats.total} chunks`);
    ok("Document chunkCount matches", doc.chunkCount === stats.total, `doc says ${doc.chunkCount}, DB has ${stats.total}`);
    ok("Every chunk has an embedding", stats.withVector === stats.total, `${stats.withVector}/${stats.total}`);
    ok(`Vector size is ${expectedDims}`, stats.dims.length === 1 && stats.dims[0] === expectedDims, `sizes found: ${stats.dims.join(", ")}`);
    ok("Embedding model saved", stats.models.length === 1 && !!stats.models[0], `${stats.models.join(", ")}`);
    console.log(`INFO  Pages covered: ${pages.join(", ")}`);
    console.log(`INFO  Chunk length (characters): min ${stats.minLen}, avg ${Math.round(stats.avgLen)}, max ${stats.maxLen}`);

    const samples = await Chunk.find({ documentId: docId }).sort({ chunkIndex: 1 }).limit(2).select("chunkIndex pageNumber text");
    for (const s of samples) {
        console.log(`\nChunk ${s.chunkIndex} (page ${s.pageNumber}): ${s.text.slice(0, 160)}...`);
    }

    // ---------- Part 2: real vector search ----------
    if (!question) {
        console.log("\nTip: add a question to also test vector search.");
        return;
    }

    console.log(`\nSearching for: "${question}"`);
    const queryVector = await embedQuery(question);

    const results = await Chunk.aggregate([
        {
            $vectorSearch: {
                index: "chunk_vector_index",
                path: "embeddingVector",
                queryVector,
                numCandidates: 50,
                limit: 5,
                filter: { documentId: docId },
            },
        },
        { $project: { pageNumber: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
    ]);

    ok("Vector search returned results", results.length > 0,
        results.length === 0 ? "check that the Atlas index is Active and named chunk_vector_index" : `${results.length} results`);

    for (const r of results) {
        console.log(`\nscore ${r.score.toFixed(3)} | page ${r.pageNumber}: ${r.text.slice(0, 200)}...`);
    }
};

run()
    .catch((err) => console.error("Check failed:", err))
    .finally(() => mongoose.disconnect());