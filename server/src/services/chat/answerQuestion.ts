
import type { Types } from "mongoose";
import { retrieveChunks } from "../../jobs/retrieve.js";
import {
    classifyIntent,
    generateAnswer,
    LLM_MODEL,
} from "../output/generateanswer.js";

export type TrustLevel =
    | "strong"
    | "partial"
    | "not_found"
    | "conversation";

export type ResponseType =
    | "conversation"
    | "document"
    | "generation";

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
    responseType: ResponseType;
    trustLevel: TrustLevel;
    citations: AnswerCitation[];
    tokenUsage: { input: number; output: number };
    modelUsed: string;
    latencyMs: number;
};

type HistoryItem = {
    role: "user" | "assistant";
    content: string;
};

const NOT_FOUND_TEXT =
    "I couldn't find enough relevant information in the selected documents to answer this question.";

const STRONG_SCORE = 0.75;

const sanitizeAnswer = (answer: string): string => {
    return answer
        // Remove complete internal citation references.
        .replace(/\[chunk:[^\]]+\]/gi, "")
        // Remove any remaining chunk:<id> references.
        .replace(/\bchunk:[a-f\d]{12,}\b/gi, "")
        .trim();
};

const buildConversation = (history: HistoryItem[]): string => {
    return history
        .slice(-10)
        .map(
            (message) =>
                `${message.role}: ${message.content.slice(0, 1500)}`
        )
        .join("\n");
};

export const answerQuestion = async (
    question: string,
    ownerId: string,
    documentIds: Types.ObjectId[],
    history: HistoryItem[]
): Promise<AnswerResult> => {
    const started = Date.now();

    const conversation = buildConversation(history);

    // 1. Detect what the user actually wants before retrieving documents.
    const responseType = await classifyIntent(question, history);

    // 2. Normal conversation does not require document retrieval.
    if (responseType === "conversation") {
        const prompt = `
Conversation history:
${conversation || "No previous conversation."}

Latest user message:
${question}

Respond naturally to the user's latest message.

Rules:
- Answer general questions normally.
- Respond naturally to greetings and acknowledgments.
- Do not force the conversation toward uploaded documents.
- Do not repeat previous answers unnecessarily.
- If the user says thanks, okay, or theek, respond briefly.
- Do not invent details about DocuMind AI's implementation.
- Do not return document citations.
`;

        const raw = await generateAnswer(prompt, "conversation");

        return {
            content: sanitizeAnswer(raw.answer),
            responseType: "conversation",
            trustLevel: "conversation",
            citations: [],
            tokenUsage: raw.usage,
            modelUsed: LLM_MODEL,
            latencyMs: Date.now() - started,
        };
    }

    // 3. Retrieve evidence only for document-related tasks.
    const chunks = await retrieveChunks(
        question,
        ownerId,
        documentIds
    );

    if (chunks.length === 0) {
        return {
            content: NOT_FOUND_TEXT,
            responseType,
            trustLevel: "not_found",
            citations: [],
            tokenUsage: { input: 0, output: 0 },
            modelUsed: "none",
            latencyMs: Date.now() - started,
        };
    }

    // 4. Build evidence passages.
    const passages = chunks
        .map(
            (chunk) =>
                `[chunk:${chunk.chunkId} | ${chunk.documentName} | page ${chunk.pageNumber}]\n${chunk.text}`
        )
        .join("\n\n");

    const prompt = `
Conversation history:
${conversation || "No previous conversation."}

Latest user message:
${question}

Retrieved document evidence:
${passages}

Response type:
${responseType}

Instructions:
- Answer the latest user message.
- Use the retrieved evidence as the source of truth.
- Use conversation history to understand follow-up references.
- Do not treat conversation history as proof of document facts.
- Cite only evidence that directly supports your answer.
- Never expose internal chunk IDs in your answer.
- If the user requests question generation, follow the exact
  requested question count and marks distribution.
- Before returning generated questions, verify the count.
- Do not invent document-specific information.
- If evidence is incomplete, answer the supported part and
  explain what is missing.
`;

    // 5. Generate the document-grounded response.
    const raw = await generateAnswer(prompt, responseType);

    // 6. Validate every citation against retrieved chunks.
    const byId = new Map(
        chunks.map((chunk) => [
            chunk.chunkId.toString(),
            chunk,
        ])
    );

    const citations: AnswerCitation[] = [];

    for (const rawId of new Set(raw.citedChunkIds)) {
        const id = rawId.replace(/^chunk:/i, "").trim();
        const chunk = byId.get(id);

        if (!chunk) {
            console.warn("Unknown citation chunk ID:", rawId);
            continue;
        }

        citations.push({
            documentId: chunk.documentId,
            documentName: chunk.documentName,
            chunkId: chunk.chunkId,
            pageNumber: chunk.pageNumber,
            excerpt: chunk.text.slice(0, 300),
            relevanceScore: chunk.score,
        });
    }

    // 7. Determine evidence confidence.
    let trustLevel: TrustLevel;

    if (raw.insufficientEvidence || citations.length === 0) {
        trustLevel = "not_found";
    } else if (
        Math.max(
            ...citations.map((citation) => citation.relevanceScore)
        ) >= STRONG_SCORE
    ) {
        trustLevel = "strong";
    } else {
        trustLevel = "partial";
    }

    return {
        content: sanitizeAnswer(raw.answer),
        responseType,
        trustLevel,
        citations: trustLevel === "not_found" ? [] : citations,
        tokenUsage: raw.usage,
        modelUsed: LLM_MODEL,
        latencyMs: Date.now() - started,
    };
};
