
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

import { toast } from "sonner";

import {
    Trash2,
    Layers,
    Loader2,
    X,
    FileText,
    UploadCloud,
    FilePlus2,
} from "lucide-react";

import {
    uploadDocuments,
    listDocuments,
    deleteDocument,
    type DocItem,
} from "@/lib/api/documents";

import Sidebar from "@/app/(app)/layout";

// ================= USER TYPE =================

type DashboardUser = {
    id: string;
    name: string;
    email: string;
    theme: string;
    stats: {
        totalQuestionsAsked: number;
        totalDocumentsUploaded: number;
        totalInputTokens: number;
        totalOutputTokens: number;
    };
};

// ================= DASHBOARD =================

export default function Dashboard() {
    const router = useRouter();

    // ================= CLERK AUTHENTICATION =================

    const { isLoaded, isSignedIn } = useUser();
    const { getToken, signOut } = useAuth();

    // MongoDB user profile
    const [user, setUser] = useState<DashboardUser | null>(null);

    const [loading, setLoading] = useState(true);

    // ================= FILE UPLOAD STATES =================

    const inputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState("");

    // ================= DOCUMENT STATES =================

    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ================= LOAD AUTHENTICATED USER =================

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setLoading(false);
            router.replace("/login");
            return;
        }

        let active = true;

        async function loadUser() {
            try {
                const token = await getToken();

                if (!token) {
                    throw new Error("Authentication token not found.");
                }

                const API_URL =
                    process.env.NEXT_PUBLIC_API_URL ??
                    "http://localhost:5000/api";

                const response = await fetch(`${API_URL}/auth/me`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result?.message || "Unable to load user profile."
                    );
                }

                if (active) {
                    setUser(result.user);
                }
            } catch (error) {
                console.error("Dashboard authentication error:", error);

                if (active) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Unable to load your workspace."
                    );

                    router.replace("/login");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadUser();

        return () => {
            active = false;
        };
    }, [isLoaded, isSignedIn, getToken, router]);

    // ================= LOAD DOCUMENTS =================

    useEffect(() => {
        if (!user) return;

        let active = true;

        async function loadDocuments() {
            try {
                const result = await listDocuments();

                if (active) {
                    setDocuments(result.documents);
                }
            } catch (error) {
                console.error("Document loading error:", error);

                if (active) {
                    toast.error("Unable to fetch documents.");
                }
            }
        }

        void loadDocuments();

        return () => {
            active = false;
        };
    }, [user]);

    // ================= HANDLE FILE UPLOAD =================

    async function handleUpload() {
        if (files.length === 0) return;

        if (files.length > 5) {
            setError("You can only upload up to 5 files at a time.");
            return;
        }

        try {
            setUploading(true);

            await uploadDocuments(files);

            const result = await listDocuments();

            setDocuments(result.documents);
            setFiles([]);
            setError("");

            toast.success("File uploaded successfully.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to upload file."
            );
        } finally {
            setUploading(false);
        }
    }

    // ================= HANDLE DOCUMENT DELETE =================

    async function handleDelete(id: string) {
        try {
            setDeletingId(id);

            await deleteDocument(id);

            setDocuments((previous) =>
                previous.filter((document) => document.id !== id)
            );

            toast.success("File deleted successfully.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to delete file."
            );
        } finally {
            setDeletingId(null);
        }
    }

    // ================= CLERK LOGOUT =================

    async function handleLogout() {
        try {
            await signOut({
                redirectUrl: "/login",
            });
        } catch (error) {
            console.error("Logout error:", error);

            toast.error("Unable to log out.");
        }
    }

    // ================= HANDLE FILE SELECTION =================

    const handleFiles = (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        const selected = Array.from(selectedFiles);

        const validFiles = selected.filter((file) => {
            const validType = /\.(pdf|docx|txt)$/i.test(file.name);
            const validSize = file.size <= 20 * 1024 * 1024;

            return validType && validSize;
        });

        if (validFiles.length !== selected.length) {
            setError(
                "Only PDF, DOCX and TXT files up to 20 MB are allowed."
            );
        } else {
            setError("");
        }

        if (validFiles.length > 0) {
            setFiles((previous) => {
                const newFiles = validFiles.filter(
                    (file) =>
                        !previous.some(
                            (existing) =>
                                existing.name === file.name &&
                                existing.size === file.size &&
                                existing.lastModified === file.lastModified
                        )
                );

                return [...previous, ...newFiles];
            });
        }
    };

    // ================= REMOVE SELECTED FILE =================

    const removeFile = (index: number) => {
        setFiles((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    // ================= CLEAR ALL FILES =================

    const clearFiles = () => {
        setFiles([]);
        setError("");
    };

    // ================= LOADING SCREEN =================

    if (!isLoaded || loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="animate-pulse text-muted-foreground">
                    Loading your workspace...
                </p>
            </main>
        );
    }

    if (!isSignedIn || !user) {
        return null;
    }

    // ================= DASHBOARD UI =================

    return (
        <>
            <Sidebar />

            <main className="min-h-screen pt-24 text-foreground transition-colors duration-300">
                <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-10">

                    {/* ================= HEADER ================= */}

                    <header className="flex flex-wrap items-center justify-between gap-5">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                Your personal workspace
                            </p>

                            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                                Welcome, {user.name}!
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Usage Indicator */}

                            <span className="rounded-full border border-[#ff9500]/20 bg-[#ff9500]/10 px-4 py-2 text-sm font-bold text-[#FFB020]">
                                {user.stats.totalQuestionsAsked} / 50 questions today
                            </span>

                            {/* Logout */}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                                Log out
                            </button>
                        </div>
                    </header>

                    {/* ================= UPLOAD + IMAGE ================= */}

                    <section className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-stretch">

                        {/* LEFT: DOCUMENT UPLOAD */}

                        <div className="w-full space-y-4">
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();
                                        inputRef.current?.click();
                                    }
                                }}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);
                                }}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);
                                    handleFiles(event.dataTransfer.files);
                                }}
                                onClick={() => inputRef.current?.click()}
                                className={`group flex min-h-[250px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    isDragging
                                        ? "scale-[1.01] border-pink-400 bg-pink-500/10"
                                        : "border-white/30 hover:border-white/60"
                                }`}
                                style={{
                                    background:
                                        "radial-gradient(ellipse at 10% 0%, #603421 0%, #38221f 55%, #211719 100%)",
                                }}
                            >
                                {/* Upload Icon */}

                                <div className="mb-4 rounded-2xl bg-white/10 p-4 transition-transform duration-300 group-hover:scale-110">
                                    <UploadCloud className="size-9 text-orange-300" />
                                </div>

                                {/* Heading */}

                                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                                    Drop a document. Ask it anything.
                                </h2>

                                <p className="mt-2 text-sm text-white/60">
                                    Upload your documents and start an intelligent conversation.
                                </p>

                                <p className="mt-2 text-xs text-white/50">
                                    PDF, DOCX or TXT · Maximum 20 MB per file
                                </p>

                                {/* Choose Files */}

                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        inputRef.current?.click();
                                    }}
                                    className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-300 to-pink-500 px-6 py-2.5 text-sm font-semibold text-black shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-orange-500/20 active:scale-95"
                                >
                                    <FilePlus2 size={17} />
                                    Choose files
                                </button>

                                {/* Hidden Input */}

                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    multiple
                                    hidden
                                    onChange={(event) => {
                                        handleFiles(event.target.files);
                                        event.target.value = "";
                                    }}
                                />
                            </div>

                            {/* Error Message */}

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                    <X size={16} />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: IMAGE - DESKTOP ONLY */}

                        <div className="hidden min-h-[250px] overflow-hidden rounded-2xl lg:flex lg:items-center lg:justify-center">
                            <img
                                src="/image.png"
                                alt="DocuMind AI document intelligence"
                                className="h-full min-h-[250px] w-full rounded-2xl object-fill"
                            />
                        </div>
                    </section>

                    {/* ================= SELECTED DOCUMENTS ================= */}

                    {files.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Selected Documents
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        {files.length} document(s) ready for upload
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={clearFiles}
                                        disabled={uploading}
                                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                                    >
                                        Clear all
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-300 to-pink-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
                                    >
                                        {uploading ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <UploadCloud size={16} />
                                        )}

                                        {uploading
                                            ? "Uploading..."
                                            : "Upload"}
                                    </button>
                                </div>
                            </div>

                            {/* Document Cards */}

                            <div className="grid gap-3 sm:grid-cols-2">
                                {files.map((file, index) => (
                                    <div
                                        key={`${file.name}-${file.lastModified}-${index}`}
                                        className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="shrink-0 rounded-xl bg-orange-500/10 p-3">
                                                <FileText className="size-5 text-orange-500" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {file.name}
                                                </p>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>

                                        {/* Remove Button */}

                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ================= UPLOADED DOCUMENTS ================= */}

                    <section className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Uploaded Documents
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                {documents.length} document(s) uploaded
                            </p>
                        </div>

                        {documents.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                No documents uploaded yet.
                            </p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="shrink-0 rounded-xl bg-orange-500/10 p-3">
                                                <FileText className="size-5 text-orange-500" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {doc.filename}
                                                </p>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {(doc.size / 1024 / 1024).toFixed(2)} MB

                                                    {doc.status !== "ready" &&
                                                        ` · ${doc.status}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                                                <Layers
                                                    size={14}
                                                    className="text-orange-400"
                                                />

                                                {doc.chunkCount} chunks
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(doc.id)
                                                }
                                                disabled={
                                                    deletingId === doc.id
                                                }
                                                aria-label={`Delete ${doc.filename}`}
                                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                            >
                                                {deletingId === doc.id ? (
                                                    <Loader2
                                                        size={18}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </section>
            </main>
        </>
    );
}
