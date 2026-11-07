import {
  FileText,
  File,
  FileType,
  Trash2,
  Loader2,
  Layers,
  CalendarDays,
  HardDrive,
} from "lucide-react";

import type { DocItem } from "@/lib/api/documents";
import { formatSize, formatDate, getFileExtension } from "@/lib/utils/document";
import StatusBadge from "./StatusBadge";

type Props = {
  document: DocItem;
  view: "grid" | "list";
  deleting: boolean;
  onDelete: (id: string) => void;
};

export default function DocumentCard({ document, view, deleting, onDelete }: Props) {
  const extension = getFileExtension(document.filename);
  const Icon = extension === "PDF" ? FileText : extension === "DOCX" ? FileType : File;
  const isList = view === "list";

  return (
    <article
      className={`glass group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] ${
        isList ? "flex items-center gap-4 p-4" : "p-5"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-border ${isList ? "hidden" : ""}`}
      />

      <div
        className={`flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 text-primary ${
          isList ? "size-12 shrink-0" : "mb-5 size-14"
        }`}
      >
        <Icon size={isList ? 23 : 27} />
      </div>

      <div className={`min-w-0 flex-1 ${isList ? "" : "space-y-3"}`}>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              title={document.filename}
              className="truncate text-sm font-bold text-foreground"
            >
              {document.filename}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{extension} document</p>
          </div>

          {isList && <StatusBadge status={document.status} />}
        </div>

        {!isList && <StatusBadge status={document.status} />}

        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${
            isList ? "mt-2" : "border-t border-border pt-3"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <HardDrive size={13} />
            {formatSize(document.size)}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={13} />
            {document.chunkCount ?? 0} chunks
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {formatDate(document.createdAt)}
          </span>
        </div>
      </div>

      <div
        className={`flex items-center ${
          isList
            ? "ml-auto shrink-0 gap-2"
            : "mt-4 justify-between border-t border-border pt-3"
        }`}
      >
        <button
          type="button"
          onClick={() => onDelete(document.id)}
          disabled={deleting || document.status === "deleting"}
          aria-label={`Delete ${document.filename}`}
          className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <>
              Delete <Trash2 size={17} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}