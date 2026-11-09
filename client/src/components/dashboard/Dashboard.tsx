
"use client";
 
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
 
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";
 
import {
  Trash2,
  Layers,
  Loader2,
  X,
  FileText,
  UploadCloud,
  FilePlus2,
} from "lucide-react";
 
import { getMe, type MeUser } from "@/lib/api/auth";
import { getUsage } from "@/lib/api/usage";
 
import {
  uploadDocuments,
  listDocuments,
  deleteDocument,
  type DocItem,
} from "@/lib/api/documents";
import Sidebar from "@/app/(app)/layout";
 
// ================= DASHBOARD =================
 
export default function Dashboard() {
  const router = useRouter();
  const request = useApi();
 
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
 
  const requestRef = useRef(request);
 
  useEffect(() => {
    requestRef.current = request;
  }, [request]);
 
  // MongoDB user profile
  const [user, setUser] = useState<MeUser | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
 
  // File upload state
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
 
  // Document state
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
 
  // ================= LOAD AUTHENTICATED USER =================
 
  useEffect(() => {
    if (!isLoaded) return;
 
    // Clerk ke hisaab se user logged-out ho tabhi login 
    if (!isSignedIn) {
      setLoading(false);
      router.replace("/login");
      return;
    }
 
    let active = true;
 
    async function loadUser() {
      setLoading(true);
      setLoadError("");
 
      try {
        const result = await getMe(requestRef.current);
 
        if (!active) return;
 
        setUser(result.user);
 
        // Usage optional hai: fail ho to dashboard
        try {
          const usageResult = await getUsage(requestRef.current);
 
          if (active) {
            setUsage({
              used: usageResult.usage.used,
              limit: usageResult.usage.limit,
            });
          }
        } catch (usageError) {
          console.error("Usage loading error:", usageError);
        }
      } catch (error) {
        console.error("Dashboard authentication error:", error);

        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load your workspace."
          );
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
  }, [isLoaded, isSignedIn, router, reloadKey]);
 
  // ================= LOAD DOCUMENTS =================
 
  useEffect(() => {
    if (!user) return;
 
    let active = true;
 
    async function loadDocuments() {
      try {
        const result = await listDocuments(requestRef.current);
 
        if (active) {
          setDocuments(result);
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
 
      const uploaded = await uploadDocuments(files, request);
 
      const result = await listDocuments(request);
 
      setDocuments(result);
      setFiles([]);
      setError("");
      const failedCount = uploaded.filter(
        (doc) => doc.status === "failed"
      ).length;
 
      if (failedCount === 0) {
        toast.success("File uploaded successfully.");
      } else if (failedCount === uploaded.length) {
        toast.error(
          "Upload finished but processing failed. The file may be empty or scanned."
        );
      } else {
        toast.warning(
          `${failedCount} of ${uploaded.length} file(s) failed to process.`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload file."
      );
    } finally {
      setUploading(false);
    }
  }
 
  // ================= HANDLE DOCUMENT DELETE =================
 
  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
 
      await deleteDocument(id, request);
 
      setDocuments((previous) =>
        previous.filter((document) => document.id !== id)
      );
 
      toast.success("File deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete file."
      );
    } finally {
      setDeletingId(null);
    }
  }
 
  // ================= CLERK LOGOUT =================
 
  async function handleLogout() {
    try {
      await signOut({ redirectUrl: "/login" });
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
      setError("Only PDF, DOCX and TXT files up to 20 MB are allowed.");
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
 
  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  };
 
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
 
  // ================= ERROR SCREEN =================
 
  if (isSignedIn && loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-bold text-foreground">
            Unable to load your workspace
          </h1>
 
          <p className="text-sm text-muted-foreground">{loadError}</p>
 
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="rounded-xl bg-gradient-to-r from-orange-300 to-pink-500 px-5 py-2 text-sm font-semibold text-black"
            >
              Try again
            </button>
 
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              Log out
            </button>
          </div>
        </div>
      </main>
    );
  }
 
  if (!isSignedIn || !user) {
    return null;
  }
 
  // ================= DASHBOARD UI =================
 
  return (
    <main className="min-h-screen pt-24 text-foreground transition-colors duration-300">
      <Sidebar/>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-10">
        {/* HEADER */}
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
            {/* FIX 3: pehle lifetime total dikh raha tha ("/ 50 questions today") */}
            <span className="rounded-full border border-[#ff9500]/20 bg-[#ff9500]/10 px-4 py-2 text-sm font-bold text-[#FFB020]">
              {usage?.used ?? 0} / {usage?.limit ?? 50} questions today
            </span>
 
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              Log out
            </button>
          </div>
        </header>
 
        {/* UPLOAD + IMAGE */}
        <section className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-stretch">
          {/* LEFT: DOCUMENT UPLOAD */}
          <div className="w-full space-y-4">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
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
              <div className="mb-4 rounded-2xl bg-white/10 p-4 transition-transform duration-300 group-hover:scale-110">
                <UploadCloud className="size-9 text-orange-300" />
              </div>
 
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Drop a document. Ask it anything.
              </h2>
 
              <p className="mt-2 text-sm text-white/60">
                Upload your documents and start an intelligent conversation.
              </p>
 
              <p className="mt-2 text-xs text-white/50">
                PDF, DOCX or TXT · Maximum 20 MB per file
              </p>
 
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
 
        {/* SELECTED DOCUMENTS */}
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
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
 
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
 
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
 
        {/* UPLOADED DOCUMENTS */}
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
                        {doc.status !== "ready" && ` · ${doc.status}`}
                      </p>
                    </div>
                  </div>
 
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                      <Layers size={14} className="text-orange-400" />
                      {doc.chunkCount} chunks
                    </div>
 
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      aria-label={`Delete ${doc.filename}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 size={18} className="animate-spin" />
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
  );
}
