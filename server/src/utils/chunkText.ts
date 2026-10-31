export const chunkText = (text: string, chunkSize = 800, overlap = 100): string[] => {
    const clean = text.replace(/\s+/g, " ").trim();
    const chunks: string[] = [];
    let start = 0;

    while (start < clean.length) {
        const end = Math.min(start + chunkSize, clean.length);
        chunks.push(clean.slice(start, end));
        if (end === clean.length) break;
        start = end - overlap;
    }

    return chunks;
}