import { api } from "./client";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleting";

export type DocItem = {
  id: string;
  filename: string;
  size: number;
  status: DocumentStatus;
  chunkCount: number;
  createdAt?: string;
};

export type UploadResult = {
  id: string;
  filename: string;
  size: number;
  status: DocumentStatus;
  chunkCount: number;
};

type RawDocument = {
  _id?: string;
  id?: string;
  filename?: string;
  displayName?: string;
  originalFileName?: string;
  fileName?: string;
  size?: number;
  fileSize?: number;
  status?: DocumentStatus;
  chunkCount?: number;
  chunksCount?: number;
  createdAt?: string;
};

const normalizeDocument = (doc: RawDocument): DocItem => ({
  id: String(doc.id ?? doc._id ?? ""),
  filename:
    doc.filename ??
    doc.displayName ??
    doc.originalFileName ??
    doc.fileName ??
    "Untitled document",
  size: doc.size ?? doc.fileSize ?? 0,
  status: doc.status ?? "uploaded",
  chunkCount: doc.chunkCount ?? doc.chunksCount ?? 0,
  createdAt: doc.createdAt,
});

export const uploadDocuments = (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => formData.append("files", file));

  return api<{
    success: boolean;
    results: UploadResult[];
  }>("/documents/upload", {
    method: "POST",
    body: formData,
  });
};

export const listDocuments = async () => {
  const response = await api<{
    success: boolean;
    documents: RawDocument[];
  }>("/documents");

  return {
    success: response.success,
    documents: (response.documents ?? []).map(normalizeDocument),
  };
};

export const deleteDocument = (id: string) =>
  api<{ success: boolean; message: string }>(`/documents/${id}`, {
    method: "DELETE",
  });