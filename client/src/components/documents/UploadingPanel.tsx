"use client";

import { useRef } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
} from "lucide-react";

import { formatSize } from "@/lib/utils/document";
import { cn } from "cn";

type Props = {
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploading: boolean;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  uploadError: string;
  setUploadError: (value: string) => void;
  onUpload: () => void;
  onClose: () => void;
};

export default function UploadPanel({
  selectedFiles,
  setSelectedFiles,
  uploading,
  isDragging,
  setIsDragging,
  uploadError,
  setUploadError,
  onUpload,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const selected = Array.from(fileList);

    const validFiles = selected.filter((file) => {
      const validType = /\.(pdf|docx|txt)$/i.test(file.name);
      const validSize = file.size <= 20 * 1024 * 1024;

      return validType && validSize;
    });

    if (validFiles.length !== selected.length) {
      setUploadError(
        "Only PDF, DOCX and TXT files up to 20 MB are allowed."
      );
    } else {
      setUploadError("");
    }

    setSelectedFiles((previous) => {
      const combined = [...previous, ...validFiles];

      const unique = combined.filter(
        (file, index, array) =>
          array.findIndex(
            (other) =>
              other.name === file.name &&
              other.size === file.size &&
              other.lastModified === file.lastModified
          ) === index
      );

      if (unique.length > 5) {
        setUploadError("You can upload up to 5 files at a time.");
        return unique.slice(0, 5);
      }

      return unique;
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  return (
    <section className={cn("space-y-4 rounded-3xl border p-5 sm:p-7")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            Upload documents
          </h2>
          <p className="mt-1 text-xs text-white/50">
            PDF, DOCX or TXT · Maximum 20 MB per file · Up to 5 files
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          aria-label="Close upload panel"
          className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
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
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition-all ${
          isDragging
            ? "border-pink-400 bg-pink-400/10"
            : "border-white/20 bg-black/10 hover:border-orange-300/50"
        }`}
      >
        <div className="mb-4 rounded-2xl bg-white/10 p-4">
          <UploadCloud size={32} className="text-orange-300" />
        </div>

        <h3 className="font-bold text-white">
          Drop your documents here
        </h3>

        <p className="mt-2 text-xs text-white/45">
          Or click to browse your files
        </p>

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

      {uploadError && (
        <p className="text-sm text-red-300">{uploadError}</p>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-orange-300" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {file.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={uploading}
                aria-label={`Remove ${file.name}`}
                className="rounded-lg p-2 text-white/40 hover:bg-red-400/10 hover:text-red-400"
              >
                <X size={17} />
              </button>
            </div>
          ))}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedFiles([]);
                setUploadError("");
              }}
              disabled={uploading}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5"
            >
              Clear all
            </button>

            <button
              type="button"
              onClick={onUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-300 to-pink-500 px-5 py-2.5 text-sm font-bold text-[#251719] disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}
              {uploading ? "Uploading..." : "Upload files"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}