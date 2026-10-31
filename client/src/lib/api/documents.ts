import {api} from "./client";

export type DocItem = {
    id: string;
    name:string;
    size:number;
    status: "uploaded" | "processing" | "ready" | "failed" | "deleting";
    chunksCount: number;
    createdAt?: string;
};

export const uploadDocuments = (files: File[]) => {
    const formData = new FormData();
    files.forEach((file)=>formData.append("files",file));

    return api<{
        success: boolean;
        results: {id:string; filename:string; size:number; status: DocItem["status"]; chunkCount:number}[];
    }>("/documents/upload", {method:"POST", body: formData});
}

export const listDocuments = () => api<{success: boolean; documents: DocItem[]}>("/documents");

export const deleteDocument = (id:string) => api<{success: boolean; message: string}>(`/documents/${id}`, {method:"DELETE"});

