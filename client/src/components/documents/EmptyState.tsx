import { FileText, Plus } from "lucide-react";

type Props = {
  search: string;
  onUpload: () => void;
};

export default function EmptyState({ search, onUpload }: Props) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-5 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-300/10">
        <FileText size={30} className="text-orange-300" />
      </div>

      <h3 className="text-lg font-bold text-white">
        {search ? "No matching documents" : "Your library is empty"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
        {search
          ? "Try searching with another document name."
          : "Upload your first document and start asking questions with AI-powered answers and citations."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onUpload}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-300 to-pink-500 px-5 py-3 text-sm font-bold text-[#241719] transition-transform hover:scale-105"
        >
          <Plus size={17} />
          Upload document
        </button>
      )}
    </div>
  );
}