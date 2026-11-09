import { defaultRequest, type ApiRequest } from "./client";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleting";

// Frontend ke components (DocumentCard, Dashboard, ChatPage) yahi shape use karte hain
export interface DocItem {
  id: string;
  filename: string;
  size: number;
  status: DocumentStatus;
  chunkCount: number;
  pageCount: number;
  errorCode: string | null;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Server alag-alag endpoints par alag field names bhejta hai:
//   GET  /documents        -> id, displayName, fileSize
//   POST /documents/upload -> id, filename, size
// Isliye dono ko yahan ek hi DocItem shape mein convert kiya jaata hai.
interface RawDocument {
  id?: string;
  _id?: string;
  displayName?: string;
  originalFileName?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  size?: number;
  status?: string;
  errorCode?: string | null;
  chunkCount?: number;
  pageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const STATUSES: DocumentStatus[] = [
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleting",
];

const toStatus = (status?: string): DocumentStatus =>
  STATUSES.includes(status as DocumentStatus)
    ? (status as DocumentStatus)
    : "uploaded";

const normalizeDocument = (doc: RawDocument): DocItem => ({
  id: String(doc.id ?? doc._id ?? ""),
  filename:
    doc.displayName ??
    doc.originalFileName ??
    doc.filename ??
    "Untitled document",
  size: doc.fileSize ?? doc.size ?? 0,
  status: toStatus(doc.status),
  chunkCount: doc.chunkCount ?? 0,
  pageCount: doc.pageCount ?? 0,
  errorCode: doc.errorCode ?? null,
  mimeType: doc.mimeType,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Server default mein sirf 12 documents deta hai, isliye limit=100 (server ka max)
export const listDocuments = async (
  request: ApiRequest = defaultRequest
): Promise<DocItem[]> => {
  const response = await request<{
    success: boolean;
    documents: RawDocument[];
  }>("/documents?limit=100");

  return (response.documents ?? []).map(normalizeDocument);
};

export const uploadDocuments = async (
  files: File[],
  request: ApiRequest = defaultRequest
): Promise<DocItem[]> => {
  const formData = new FormData();

 
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await request<{
    success: boolean;
    results: RawDocument[];
  }>("/documents/upload", {
    method: "POST",
    body: formData,
  });

  return (response.results ?? []).map(normalizeDocument);
};

export const deleteDocument = async (
  id: string,
  request: ApiRequest = defaultRequest
) => {
  return request<{
    success: boolean;
    message: string;
  }>(`/documents/${id}`, {
    method: "DELETE",
  });
};