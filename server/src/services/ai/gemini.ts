
export const EMBEDDING_MODEL =
    process.env.EMBEDDING_MODEL ??
    "@cf/baai/bge-base-en-v1.5";

export const EMBEDDING_DIMENSIONS = Number(
    process.env.EMBEDDING_DIMENSIONS ?? 768
);

const BATCH_SIZE = 50;

type CloudflareEmbeddingResponse = {
    success: boolean;
    errors?: Array<{
        message?: string;
    }>;
    result?: {
        shape: number[];
        data: number[][];
    };
};

const normalize = (vector: number[]): number[] => {
    const norm = Math.sqrt(
        vector.reduce((sum, value) => sum + value * value, 0)
    );

    if (!norm) {
        throw new Error("INVALID_EMBEDDING_VECTOR");
    }

    return vector.map((value) => value / norm);
};

const getCredentials = () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

    const model = (
        process.env.EMBEDDING_MODEL ??
        "@cf/baai/bge-base-en-v1.5"
    ).trim();

    if (!accountId || !apiToken) {
        throw new Error("CLOUDFLARE_CREDENTIALS_MISSING");
    }
    const endpoint =
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    console.log("Cloudflare embedding model:", model);
    console.log("Cloudflare endpoint configured:", Boolean(endpoint));
    return { accountId, apiToken };
};

const embedBatch = async (
    texts: string[]
): Promise<number[][]> => {
    if (!texts.length) return [];

    const { accountId, apiToken } = getCredentials();

    const endpoint =
        `https://api.cloudflare.com/client/v4/accounts/` +
        `${accountId}/ai/run/${EMBEDDING_MODEL}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: texts,
        }),
    });

    const data =
        (await response.json()) as CloudflareEmbeddingResponse;

    if (!response.ok || !data.success) {
        console.error(
            "Cloudflare embedding error:",
            data.errors
        );

        throw new Error("EMBEDDING_API_FAILED");
    }

    const embeddings = data.result?.data;

    if (!embeddings || embeddings.length !== texts.length) {
        throw new Error("EMBEDDING_COUNT_MISMATCH");
    }

    return embeddings.map((vector) => {
        if (vector.length !== EMBEDDING_DIMENSIONS) {
            throw new Error(
                `EMBEDDING_DIMENSION_MISMATCH: expected ${EMBEDDING_DIMENSIONS}, received ${vector.length}`
            );
        }

        return normalize(vector);
    });
};

// For document chunks
export const embedTexts = async (
    texts: string[]
): Promise<number[][]> => {
    if (!texts.length) return [];

    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        const embeddings = await embedBatch(batch);

        results.push(...embeddings);
    }

    return results;
};

// For the user's question
export const embedQuery = async (
    text: string
): Promise<number[]> => {
    if (!text.trim()) {
        throw new Error("EMPTY_QUERY");
    }

    const embeddings = await embedBatch([text]);

    if (!embeddings[0]) {
        throw new Error("EMBEDDING_FAILED");
    }

    return embeddings[0];
};
