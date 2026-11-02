import { GoogleGenAI } from "@google/genai";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "gemini-embedding-001";
const DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);

// Created on first use, so .env is already loaded by then
let client: GoogleGenAI | null = null;
export const getClient = () => {
    if (!client) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
        client = new GoogleGenAI({ apiKey });
    }
    return client;
};

// Smaller-than-default dimensions are not normalized by the API, so we do it.
const normalize = (v: number[]): number[] => {
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)) || 1;
    return v.map((x) => x / norm);
};

// For document chunks (used while saving)
export const embedTexts = async (texts: string[]): Promise<number[][]> => {
    const res = await getClient().models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: DIMENSIONS },
    });

    const embeddings = res.embeddings ?? [];
    if (embeddings.length !== texts.length) {
        throw new Error("EMBEDDING_COUNT_MISMATCH");
    }
    return embeddings.map((e) => normalize(e.values ?? []));
};

// For the user's question (used while searching)
export const embedQuery = async (text: string): Promise<number[]> => {
    const res = await getClient().models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: DIMENSIONS },
    });

    const values = res.embeddings?.[0]?.values;
    if (!values) throw new Error("EMBEDDING_FAILED");
    return normalize(values);
};