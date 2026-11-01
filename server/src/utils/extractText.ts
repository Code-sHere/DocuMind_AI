import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export type ExtractedPage = {
    pageNumber: number;
    text: string;
};

// Returns the text page by page, so every chunk can remember its real page number.
export const extractText = async (
    buffer: Buffer,
    mimeType: string
): Promise<ExtractedPage[]> => {
    if (mimeType === "application/pdf") {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });

        try {
            const result = await parser.getText();

            const pages = (result.pages ?? []).map((p) => ({
                pageNumber: p.num,
                text: p.text,
            }));

            // Fallback: if the library gave no per-page data, treat everything as page 1
            if (pages.length === 0) {
                return [{ pageNumber: 1, text: result.text }];
            }
            return pages;
        } finally {
            await parser.destroy();
        }
    }

    // DOCX and TXT have no fixed pages, so everything is "page 1"
    if (mimeType.includes("wordprocessingml")) {
        const result = await mammoth.extractRawText({ buffer });
        return [{ pageNumber: 1, text: result.value }];
    }

    return [{ pageNumber: 1, text: buffer.toString("utf-8") }];
};