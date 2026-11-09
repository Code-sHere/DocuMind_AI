"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadCloud, Sparkles } from "lucide-react";
import { toast } from "sonner";

import Sidebar from "@/app/(app)/layout";

import { getMe } from "@/lib/api/auth";

import {
  listDocuments,
  uploadDocuments,
  deleteDocument,
  type DocItem,
} from "@/lib/api/documents";

import {
  type FilterType,
  type SortType,
  type ViewType,
  getDocumentCounts,
} from "@/lib/utils/document";

import DocumentCard from "@/components/documents/DocumentCard";
import EmptyState from "@/components/documents/EmptyState";
import LibraryToolbar from "@/components/documents/LibraryToolbar";
import UploadPanel from "@/components/documents/UploadingPanel";
import DocumentStats from "@/components/documents/DoumentStats";

export default function LibraryPage() {
  // Documents
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search, filter and sorting
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [view, setView] = useState<ViewType>("grid");

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);

      const items = await listDocuments();

      setDocuments(items);
    } catch (error) {
      console.error("Load documents error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Authentication
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        await getMe();

        if (active) {
          await loadDocuments();
        }
      } catch (error) {

        console.error("Library authentication error:", error);

        if (active) {
          setLoading(false);
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load your workspace."
          );
        }
      }
    }

    void checkAuth();

    return () => {
      active = false;
    };
  }, [loadDocuments]);

  // Upload documents
  const handleUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    try {
      setUploading(true);

      await uploadDocuments(selectedFiles);

      toast.success("Documents uploaded successfully.");

      setSelectedFiles([]);
      setUploadError("");
      setShowUpload(false);

      await loadDocuments();
    } catch (error) {
      console.error("Upload documents error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to upload documents."
      );
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteDocument(id);

      setDocuments((previous) =>
        previous.filter((document) => document.id !== id)
      );

      toast.success("Document deleted successfully.");
    } catch (error) {
      console.error("Delete document error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Search, filter and sorting
  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = documents.filter((doc) => {
      const filename = doc.filename ?? "";

      const matchesFilter =
        filter === "all" || doc.status === filter;

      const matchesSearch =
        filename.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
          );

        case "name":
          return (a.filename ?? "").localeCompare(b.filename ?? "");

        case "size":
          return (b.size ?? 0) - (a.size ?? 0);

        case "newest":
        default:
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
      }
    });

    return result;
  }, [documents, filter, search, sort]);

  // Document counts
  const counts = useMemo(
    () => getDocumentCounts(documents),
    [documents]
  );

  return (
    <>
      <Sidebar />

      <main className="min-h-screen px-4 pb-16 pt-28 text-foreground sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-7xl space-y-8">

          {/* PAGE HEADER */}
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles size={14} />
                Your workspace
              </div>

              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Your{" "}
                <span className="bg-linear-to-r from-primary to-(--grad-to) bg-clip-text text-transparent">
                  Library.
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                All your knowledge, in one place. Manage documents,
                explore insights and start conversations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              <UploadCloud size={18} />
              Upload documents
            </button>
          </header>

          {/* DOCUMENT STATISTICS */}
          <DocumentStats counts={counts} />

          {/* UPLOAD PANEL */}
          {showUpload && (
            <UploadPanel
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              uploading={uploading}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              uploadError={uploadError}
              setUploadError={setUploadError}
              onUpload={handleUpload}
              onClose={() => {
                if (uploading) return;

                setShowUpload(false);
                setSelectedFiles([]);
                setUploadError("");
              }}
            />
          )}

          {/* LIBRARY TOOLBAR */}
          <LibraryToolbar
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSort={setSort}
            view={view}
            setView={setView}
            counts={counts}
            total={documents.length}
            filteredTotal={filteredDocuments.length}
            loading={loading}
            onRefresh={() => void loadDocuments()}
          />

          {/* DOCUMENT GRID / LIST */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-2xl border border-border bg-muted"
                />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              search={search}
              onUpload={() => setShowUpload(true)}
            />
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  view={view}
                  deleting={deletingId === document.id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* FOOTER */}
          <footer className="flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>DocuMind AI · Your knowledge workspace</p>
            <p>Ask your documents. Get proof, not guesses.</p>
          </footer>

        </div>
      </main>
    </>
  );
}