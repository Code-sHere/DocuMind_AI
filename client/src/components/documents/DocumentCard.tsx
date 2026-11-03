import Link from "next/link";
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
import {
    formatSize,
    formatDate,
    getFileExtension,
} from "@/lib/utils/document";

import StatusBadge from "./StatusBadge";


type Props = {
    document: DocItem;
    view: "grid" | "list";
    deleting: boolean;
    onDelete: (id: string) => void;
};

export default function DocumentCard({
    document,
    view,
    deleting,
    onDelete,
}: Props) {
    const extenstion = getFileExtension(document.filename);

    const Icon = extenstion === "PDF" ? FileText : extenstion === "DOCX" ? FileType : File;

    const isList = view === "list";

    return (
        <article
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.09]  transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/30  hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] ${isList ? "flex items-center gap-4 p-4" : "p-5"
                } glass backdrop-blur-3xl backdrop-saturate-200`}
        >
            <div
                className={`absolute inset-x-0 top-0 h-px bg-white/[0.09] ${isList ? "hidden" : ""
                    }`}
            />

            <div
                className={`flex items-center justify-center rounded-2xl border border-orange-300/10 bg-gradient-to-br from-orange-300/15 to-pink-500/10 text-orange-300 ${isList ? "size-12 shrink-0" : "mb-5 size-14"
                    }`}
            >
                <Icon size={isList ? 23 : 27} />
            </div>

            <div className={`min-w-0 flex-1 ${isList ? "" : "space-y-3"}`}>
                <div className="flex min-w-0 items-start justify-between gap-2 ">
                    <div className="min-w-0">
                        <h3
                            title={document.filename}
                            className="truncate text-sm font-bold text-white"
                        >
                            {document.filename}
                        </h3>

                        <p className="mt-1 text-xs text-white/45">
                            {extenstion} document
                        </p>
                    </div>

                    {isList && <StatusBadge status={document.status} />}
                </div>

                {!isList && <StatusBadge status={document.status} />}

                <div
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45 ${isList ? "mt-2" : "border-t border-white/[0.07] pt-3"
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
                className={`flex items-center ${isList
                    ? "ml-auto shrink-0 gap-2"
                    : "mt-4 justify-between border-t border-white/[0.07] pt-3"
                    }`}
            >
                {/* {document.status === "ready" ? (
                    <Link
                        href={`/dashboard/library/${document.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-300/10 px-3 py-2 text-xs font-semibold text-orange-300 transition-colors hover:bg-orange-300/20"
                    >
                        Open document
                    </Link>
                ) : (
                    <span className="text-xs text-white/40">
                        {document.status === "processing"
                            ? "Preparing document..."
                            : document.status === "failed"
                                ? "Processing failed"
                                : document.status === "deleting"
                                    ? "Deleting..."
                                    : "Waiting to process"}
                    </span>
                )} */}

                <button
                    type="button"
                    onClick={() => onDelete(document.id)}
                    disabled={deleting || document.status === "deleting"}
                    aria-label={`Delete ${document.filename}`}
                    className="rounded-xl p-2 text-white/40 transition-colors hover:bg-red-400/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {deleting ? (
                        <Loader2 size={17} className="animate-spin" />
                    ) : (
                        <span className="flex items-center gap-1.5 border-2 rounded-full px-3 py-2 glass bg-amber-600/50 text-white">Delete <Trash2 size={17} /></span>
                    )}
                </button>
            </div>
        </article>
    );
} 