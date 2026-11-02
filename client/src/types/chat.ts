export interface Citation {
  documentId: string;
  documentName: string;
  chunkId: string;
  pageNumber: number;
  excerpt: string;
  relevanceScore: number;
}

export interface Chat {
  id: string;
  title: string;
  documentIds: string[];
  updatedAt?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  trustLevel?: "strong" | "partial" | "not_found";
  createdAt?: string;
}