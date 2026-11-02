import type { Types } from "mongoose";
import { retrieveChunks } from "../../jobs/retrieve.js";
import { generateAnswer, LLM_MODEL } from "../output/generateanswer.js";
 
export type TrustLevel = "strong" | "partial" | "not_found";
 
export type AnswerCitation = {
    documentId: string;
    documentName: string;
    chunkId: string;
    pageNumber: number;
    excerpt: string;
    relevanceScore: number;
};
 
export type AnswerResult = {
    content: string;
    trustLevel: TrustLevel;
    citations: AnswerCitation[];
    tokenUsage: { input: number; output: number };
    modelUsed: string;
    latencyMs: number;
};
 
type HistoryItem = { role: "user" | "assistant"; content: string };
 
const NOT_FOUND_TEXT = "I couldn't find this in the selected documents.";
const STRONG_SCORE = 0.75; // tune with your own test questions
 
export const answerQuestion = async (
    question: string,
    ownerId: string,
    documentIds: Types.ObjectId[],
    history: HistoryItem[]
): Promise<AnswerResult> => {
    const started = Date.now();
 
    // 1. Find the best passages (only from the allowed documents)
    const chunks = await retrieveChunks(question, ownerId, documentIds);
 
    // 2. Nothing relevant: answer without paying for an AI call
    if (chunks.length === 0) {
        return {
            content: NOT_FOUND_TEXT,
            trustLevel: "not_found",
            citations: [],
            tokenUsage: { input: 0, output: 0 },
            modelUsed: "none",
            latencyMs: Date.now() - started,
        };
    }
 
    // 3. Build the prompt. Every passage carries its real chunk id.
    const passages = chunks
        .map((c) => `[chunk:${c.chunkId} | ${c.documentName} | page ${c.pageNumber}]\n${c.text}`)
        .join("\n\n");
 
    const conversation = history
        .map((m) => `${m.role}: ${m.content.slice(0, 500)}`)
        .join("\n");
 
    const prompt = [
        conversation ? `Conversation so far:\n${conversation}\n` : "",
        `Question:\n${question}\n`,
        `Evidence passages:\n${passages}`,
    ].join("\n");
 
    // 4. Ask the AI
    const raw = await generateAnswer(prompt);
 
    // 5. Validate citations on the server. The AI may only cite chunks we gave it.
    const byId = new Map(chunks.map((c) => [c.chunkId, c]));
    const citations: AnswerCitation[] = [];
    for (const id of new Set(raw.citedChunkIds)) {
        const c = byId.get(id);
        if (!c) continue; // unknown id: throw it away
        citations.push({
            documentId: c.documentId,
            documentName: c.documentName,
            chunkId: c.chunkId,
            pageNumber: c.pageNumber, // from our database, never from the AI
            excerpt: c.text.slice(0, 300),
            relevanceScore: c.score,
        });
    }
 
    // 6. Trust level
    let trustLevel: TrustLevel;
    if (raw.insufficientEvidence || citations.length === 0) {
        trustLevel = "not_found";
    } else if (Math.max(...citations.map((c) => c.relevanceScore)) >= STRONG_SCORE) {
        trustLevel = "strong";
    } else {
        trustLevel = "partial";
    }
 
    return {
        content: raw.answer,
        trustLevel,
        citations: trustLevel === "not_found" ? [] : citations,
        tokenUsage: raw.usage,
        modelUsed: LLM_MODEL,
        latencyMs: Date.now() - started,
    };
};
 
