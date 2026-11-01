
"use client";

import { useEffect, useState } from "react";
import { listDocuments, type DocItem } from "@/lib/api/documents";
import {
  Plus,
  Menu,
  X,
  MessageSquare,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PanelRight,
} from "lucide-react";

const HISTORY = [
  "Leave policy review",
  "Notice period clauses",
  "Chapter 4 summary",
];

const SOURCES = [
  {
    id: 1,
    file: "leave-policy.pdf",
    page: 4,
    relevance: 0.91,
    title: "4. Carry-over of leave",
    before: "Employees may carry over ",
    hl1: "ten (10) unused leave days",
    mid: " and must use them ",
    hl2: "before 31 March",
    after: " of the following year.",
  },
];

const glass =
  "rounded-xl border border-white/10 bg-white/[0.055] backdrop-blur-xl";

const gradBtn =
  "rounded-lg bg-gradient-to-r from-amber-300 to-rose-400 font-semibold text-[#1b1208] transition hover:brightness-105 active:scale-[0.98]";

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-300/90 px-1 text-[#1b1208]">
      {children}
    </mark>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <span className="mx-1 inline-flex size-[17px] items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#1b1208]">
      {n}
    </span>
  );
}

export default function ChatPage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [activeChat, setActiveChat] = useState(0);
  const [tab, setTab] = useState<"cards" | "viewer">("cards");
  const [sourceIdx, setSourceIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await listDocuments();
        setDocuments(res.documents);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      }
    };

    fetchDocuments();
  }, []);

  const source = SOURCES[sourceIdx];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_top_left,#713619_0%,#1a0a0a_45%,#361321_100%)] p-3 text-white sm:p-4 lg:p-5">

      <section className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">

        {/* SIDEBAR */}

        <aside className={`${glass} flex min-w-0 flex-col gap-4 p-3.5 sm:p-4 lg:row-span-2 xl:row-span-1`}>

          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              DocuMind <span className="text-amber-400">AI</span>
            </h1>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="rounded-lg border border-white/10 p-2 text-white/80 transition hover:bg-white/10 lg:hidden"
            >
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>

          <button
            onClick={() => {
              setActiveChat(0);
              setQuestion("");
            }}
            className={`${gradBtn} flex items-center justify-center gap-2 px-3 py-2.5 text-sm`}
          >
            <Plus size={16} />
            New chat
          </button>

          <div className={`${menuOpen ? "flex" : "hidden"} flex-col gap-5 lg:flex`}>

            {/* DOCUMENTS */}

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                In scope · {documents.length} documents
              </p>

              <div className="flex flex-wrap gap-1.5">
                {documents.map((doc) => (
                  <span
                    key={doc.id}
                    className="max-w-full truncate rounded-md border border-amber-400/30 bg-amber-400/5 px-2 py-1 font-mono text-[10px] text-white/75"
                  >
                    {doc.filename}
                  </span>
                ))}

                {documents.length === 0 && (
                  <p className="text-xs text-white/40">
                    No documents selected.
                  </p>
                )}
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                Only these documents are searched.
              </p>
            </div>

            {/* CHAT HISTORY */}

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                Today
              </p>

              <ul className="flex flex-col gap-1">
                {HISTORY.map((title, i) => (
                  <li key={title}>
                    <button
                      onClick={() => {
                        setActiveChat(i);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        activeChat === i
                          ? "bg-white/10 font-semibold text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <MessageSquare
                        size={14}
                        className="shrink-0"
                      />
                      <span className="truncate">{title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </aside>

        {/* CHAT AREA */}

        <div className="flex min-w-0 flex-col gap-3 lg:min-h-[calc(100vh-2.5rem)]">

          {/* HEADER */}

          <div className="flex min-w-0 items-center justify-between gap-2 py-1">
            <div className="min-w-0">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300/70">
                Document conversation
              </p>

              <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                {HISTORY[activeChat]}
              </h2>
            </div>

            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/60">
              <Sparkles size={12} className="text-amber-300" />
              AI Chat
            </span>
          </div>

          {/* USER MESSAGE */}

          <div className="flex justify-end">
            <div className="max-w-[90%] rounded-xl rounded-br-sm bg-[#bd3864] px-3.5 py-2.5 text-xs leading-relaxed text-white shadow-lg sm:max-w-[80%] sm:text-sm">
              How many paid leave days can be carried over, and do contractors get the same?
            </div>
          </div>

          {/* AI ANSWER */}

          <div className={`${glass} bg-black/15 p-3.5 sm:p-4`}>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                <Sparkles size={15} />
              </div>

              <span className="text-xs font-semibold text-white/80">
                DocuMind AI
              </span>

              <span className="rounded-full bg-teal-400/10 px-2 py-0.5 text-[9px] font-semibold text-teal-300">
                Answer generated
              </span>
            </div>

            <h3 className="text-base font-bold leading-snug tracking-tight sm:text-lg">
              Up to 10 days can be carried over.
            </h3>

            <p className="mt-2 text-xs leading-6 text-white/75 sm:text-sm">
              They must be used before 31 March
              <Cite n={1} />. Contractors are not covered and follow their own agreement
              <Cite n={2} />.
            </p>

            {/* CONFIDENCE */}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="h-1.5 min-w-[100px] flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[88%] rounded-full bg-teal-400" />
              </div>

              <span className="text-[10px] font-semibold text-teal-300">
                Strong evidence · 2 sources
              </span>
            </div>

            {/* CITATIONS */}

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "1 · leave-policy.pdf · p.4",
                "2 · contractor-terms.docx · p.2",
              ].map((c) => (
                <button
                  key={c}
                  className="max-w-full truncate rounded-md border border-amber-400/25 bg-amber-400/5 px-2 py-1.5 text-left font-mono text-[9px] text-amber-200/80 transition hover:bg-amber-400/10 sm:text-[10px]"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* NOT FOUND */}

          <div className="rounded-xl border border-white/10 bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-amber-300" />
              <h3 className="text-xs font-semibold">
                Not found in selected documents
              </h3>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              Closest passage: paternity leave, page 6. Try adding the HR handbook.
            </p>
          </div>

          <div className="hidden flex-1 lg:block" />

          {/* MESSAGE INPUT */}

          <div className={`${glass} bg-black/20 p-3 sm:p-3.5`}>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your documents..."
              className="max-h-32 min-h-12 w-full resize-y bg-transparent text-xs leading-relaxed text-white placeholder:text-white/35 focus:outline-none sm:text-sm"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
              <span className="text-[9px] text-white/40 sm:text-[10px]">
                /summarize · /compare · /quiz
              </span>

              <button
                disabled={!question.trim()}
                onClick={() => setQuestion("")}
                className={`${gradBtn} flex items-center gap-2 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Send
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* SOURCES PANEL */}

        <aside className={`${glass} min-w-0 p-3.5 sm:p-4 lg:col-start-2 xl:col-start-auto xl:min-h-[calc(100vh-2.5rem)]`}>

          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold">
                Sources & References
              </h3>
              <p className="mt-0.5 text-[10px] text-white/40">
                Supporting evidence for this answer
              </p>
            </div>

            <PanelRight size={17} className="text-white/45" />
          </div>

          {/* TABS */}

          <div className="mt-3 flex gap-1 rounded-lg bg-black/20 p-1">
            {(["cards", "viewer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${
                  tab === t
                    ? "bg-white/15 text-white"
                    : "text-white/45 hover:text-white"
                }`}
              >
                {t === "cards" ? "Source cards" : "Viewer"}
              </button>
            ))}
          </div>

          {tab === "cards" ? (
            <>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Source {source.id}
                </p>

                <span className="rounded-full bg-teal-400/10 px-2 py-1 text-[9px] font-semibold text-teal-300">
                  {(source.relevance * 100).toFixed(0)}% relevance
                </span>
              </div>

              {/* SOURCE CARD */}

              <article className="mt-3 rounded-xl bg-[#f7f1e3] p-3.5 text-[#1b1208] sm:p-4">
                <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-wide text-black/45">
                  <FileText size={12} />
                  <span className="break-all">
                    {source.file} · Page {source.page}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-bold leading-snug sm:text-base">
                  {source.title}
                </h4>

                <p className="mt-2 text-xs leading-6 text-black/75 sm:text-sm">
                  {source.before}
                  <Mark>{source.hl1}</Mark>
                  {source.mid}
                  <Mark>{source.hl2}</Mark>
                  {source.after}
                </p>
              </article>

              {/* SOURCE NAVIGATION */}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSourceIdx((i) => Math.max(0, i - 1))}
                  disabled={sourceIdx === 0}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs transition hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <button
                  onClick={() => setSourceIdx((i) => Math.min(SOURCES.length - 1, i + 1))}
                  disabled={sourceIdx === SOURCES.length - 1}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs transition hover:bg-white/10 disabled:opacity-30"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 p-5 text-center">
              <FileText size={25} className="text-white/30" />

              <p className="mt-2 text-xs font-semibold text-white/70">
                PDF Viewer
              </p>

              <p className="mt-1 text-[10px] text-white/40">
                Document preview will appear here.
              </p>
            </div>
          )}
        </aside>

      </section>
    </main>
  );
}
