
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const extractText = async (
    buffer: Buffer,
    mimeType: string
): Promise<string> => {
    if (mimeType === "application/pdf") {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });

        try {
            const result = await parser.getText();
            return result.text;
        } finally {
            await parser.destroy();
        }
    }

    if (mimeType.includes("wordprocessingml")) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    return buffer.toString("utf-8");
};
