import { api } from "../api/client";
import type { DocItem, DocumentStatus } from "../api/documents";

export type FilterType = "all" | DocumentStatus;
export type SortType = "newest" | "oldest" | "name" | "size";
export type ViewType = "grid" | "list";


export const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const formatDate = (date?: string) => {
    if (!date) return "Recently uploaded";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Recently uploaded";

    return parsed.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export const getFileExtension = (filename?: string) => {
    if (!filename || typeof filename !== "string") {
        return "FILE";
    }

    return filename.split(".").pop()?.toUpperCase() || "FILE";
};

export const getFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);

    if (extension === "PDF") return "pdf";
    if (extension === "DOCX") return "docx";

    return "file";
};

export type DocumentCounts = {
    all: number;
    ready: number;
    processing: number;
    failed: number;
};

export const getDocumentCounts = (documents: DocItem[]): DocumentCounts => ({
    all: documents.length,
    ready: documents.filter((doc) => doc.status === "ready").length,
    processing: documents.filter((doc) => doc.status === "processing").length,
    failed: documents.filter((doc) => doc.status === "failed").length,
});

export const getDocument = (id: string) => api<{
    success: boolean;
    document: DocItem;
  }>(`/documents/${id}`);