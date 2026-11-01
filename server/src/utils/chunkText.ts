import type { ExtractedPage } from "./extractText.js";

export type PageChunk = {
    text: string;
    pageNumber: number;
};

// 2400 characters is roughly 600 tokens, 300 characters of overlap is roughly 75 tokens.
// A chunk never crosses a page, so its pageNumber is always correct.
export const chunkPages = (
    pages: ExtractedPage[],
    chunkSize = 2400,
    overlap = 300
): PageChunk[] => {
    const chunks: PageChunk[] = [];

    for (const page of pages) {
        const clean = page.text.replace(/\s+/g, " ").trim();
        if (clean.length < 30) continue; // skip empty or near-empty pages

        let start = 0;

        while (start < clean.length) {
            let end = Math.min(start + chunkSize, clean.length);

            // Try not to cut in the middle of a sentence or a word
            if (end < clean.length) {
                const minEnd = start + Math.floor(chunkSize * 0.5);
                const sentenceEnd = clean.lastIndexOf(". ", end);
                const wordEnd = clean.lastIndexOf(" ", end);

                if (sentenceEnd > minEnd) end = sentenceEnd + 1;
                else if (wordEnd > minEnd) end = wordEnd;
            }

            const text = clean.slice(start, end).trim();
            if (text) chunks.push({ text, pageNumber: page.pageNumber });

            if (end >= clean.length) break;
            start = Math.max(end - overlap, start + 1); // always move forward
        }
    }

    return chunks;
};