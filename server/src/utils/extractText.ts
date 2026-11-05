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

            const pages: ExtractedPage[] = result.pages.map(
                (page, index) => ({
                    pageNumber: page.num || index + 1,
                    text: page.text?.trim() || "",
                })
            );

            console.log("PDF extraction:", {
                totalPages: pages.length,
                extractedCharacters: result.text.length,
                pageLengths: pages.map(p => p.text.length),
            });

            return pages;
        } finally {
            await parser.destroy();
        }
    }

    // DOCX and TXT have no fixed pages, so everything is "page 1"
    if (mimeType.includes("wordprocessingml")) {
        const result = await mammoth.extractRawText({ buffer });
        return [{ pageNumber: 1, text: result.value.trim() }];
    }


    if (mimeType === "text/plain") {
        return [{
            pageNumber: 1,
            text: buffer.toString("utf-8").trim(),
        }];
    }

    throw new Error("UNSUPPORTED_FILE_TYPE");

};