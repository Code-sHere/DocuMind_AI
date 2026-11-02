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
  Loader2,
  FileCheck,
} from "lucide-react";
import { createChat, getChatMessages, getChats, sendChatMessage } from "@/lib/api/chat";
import { toast } from "sonner";
import { Message } from "@/types/chat";

interface Citation {
  chunkId: string;
  documentName: string;
  pageNumber: number;
}

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
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        //fetch documents
        const [documentRsult, chatResult] = await Promise.all([
          listDocuments(),
          getChats()
        ]);

        setDocuments(documentRsult.documents);
        setChats(chatResult);

      } catch (err) {
        console.log(err);
      }
      finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // select and deselect documents
  const toggleDocument = (documentId: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(documentId)) {
        return prev.filter((id) => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    })
  }

  // create new chat
  const handleCreateChat = async () => {
    if (selectedDocIds.length === 0) {
      toast.error("Please select at least one document to create a chat.");
      return;
    }

    try {
      setCreatingChat(true);

      const newChat = await createChat(selectedDocIds);

      setChats((previous) => [
        newChat,
        ...previous.filter((chat) => chat.id !== newChat.id),
      ]);

      setActiveChatId(newChat.id);

      setMessages([]);
      setSelectedCitation(null);

      setMenuOpen(false);
    } catch (err) {
      console.log(err);
      toast.error("Unable to create chat.");
    } finally {
      setCreatingChat(false);
    }
  }

  // opena an existing chat
  const handleOpenChat = async (chatId: string) => {
    try {
      setActiveChatId(chatId);
      setLoadingMessages(true);
      setSelectedCitation(null);
      setMenuOpen(false);

      const chatMessages = await getChatMessages(chatId);
      setMessages(chatMessages);

      const selectedChat = chats.find((chat) => chat.id === chatId);
      if (selectedChat) {
        setSelectedDocIds(selectedChat.documentIds);
      }
      setMenuOpen(false);
    } catch (err) {
      console.log(err);
      toast.error("Unable to open chat.");
    } finally {
      setLoadingMessages(false);
    }
  }

  // start a new conversation
  const handleNewConversation = () => {
    setActiveChatId(null);
    setMessages([]);
    setQuestion("");
    setSelectedCitation(null);
    setMenuOpen(false);
  }

  // send message to gemini
  const handleSendMessage = async () => {
    const content = question.trim();

    if (!content || sending) return;

    try {
      setSending(true);

      let chatId = activeChatId;

      // If no chat exists yet, create one from selected documents
      if (!chatId) {
        if (selectedDocIds.length === 0) {
          toast.error("Select documents before asking a question.");
          return;
        }

        const newChat = await createChat(selectedDocIds);

        chatId = newChat.id;

        setActiveChatId(chatId);

        setChats((previous) => [newChat, ...previous]);
      }

      // Show user's question immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
      };

      setMessages((previous) => [...previous, userMessage]);
      setQuestion("");

      // Send question to the backend RAG pipeline
      const assistantMessage = await sendChatMessage(chatId, content);

      // Display the real Gemini response and citations
      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      // Select the first citation automatically
      if (assistantMessage.citations?.length) {
        setSelectedCitation(assistantMessage.citations[0]);
      }

      // Refresh chat list to update ordering and title
      const updatedChats = await getChats();
      setChats(updatedChats);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  };

  // get all citations
  const allCitations = messages.flatMap((message) => message.citations || []);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const readyDocuments = documents.filter((document) => document.status === "ready");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_top_left,#713619_0%,#1a0a0a_45%,#361321_100%)] p-3 text-white sm:p-4 lg:p-5">

      <section className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">

        {/* =====================================
            LEFT SIDEBAR
        ===================================== */}

        <aside className={`${glass} flex min-w-0 flex-col gap-4 p-3.5 sm:p-4`}>

          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              DocuMind <span className="text-amber-400">AI</span>
            </h1>

            <button
              onClick={() => setMenuOpen((previous) => !previous)}
              className="rounded-lg border border-white/10 p-2 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>

          {/* NEW CHAT BUTTON */}

          <button
            onClick={handleNewConversation}
            className={`${gradBtn} flex items-center justify-center gap-2 px-3 py-2.5 text-sm`}
          >
            <Plus size={16} />
            New chat
          </button>

          <div className={`${menuOpen ? "flex" : "hidden"} flex-col gap-5 lg:flex`}>

            {/* DOCUMENT SELECTION */}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                  Select documents
                </p>

                <span className="text-[10px] text-amber-300">
                  {selectedDocIds.length} selected
                </span>
              </div>

              {loading ? (
                <Loader2 className="animate-spin text-amber-300" size={18} />
              ) : (
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">

                  {documents.map((doc) => {
                    const documentId = doc.id;
                    const isReady = doc.status === "ready";
                    const isSelected = selectedDocIds.includes(documentId);

                    return (
                      <label
                        key={documentId}
                        className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-2 transition ${isSelected
                            ? "border-amber-400/40 bg-amber-400/10"
                            : "border-white/10 bg-white/[0.025] hover:bg-white/5"
                          } ${!isReady ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isReady}
                          onChange={() => toggleDocument(documentId)}
                          className="accent-amber-400"
                        />

                        <FileText size={15} className="shrink-0 text-amber-300" />

                        <span className="min-w-0 flex-1 truncate text-xs">
                          {doc.filename}
                        </span>

                        {!isReady && (
                          <span className="text-[9px] text-white/40">
                            {doc.status}
                          </span>
                        )}
                      </label>
                    );
                  })}

                  {documents.length === 0 && (
                    <p className="text-xs text-white/40">
                      No uploaded documents found.
                    </p>
                  )}
                </div>
              )}

              {/* CREATE CHAT USING SELECTED FILES */}

              <button
                onClick={handleCreateChat}
                disabled={
                  selectedDocIds.length === 0 || creatingChat
                }
                className={`${gradBtn} mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs disabled:opacity-40`}
              >
                {creatingChat && (
                  <Loader2 size={14} className="animate-spin" />
                )}

                Start chat with selected files
              </button>
            </div>

            {/* CHAT HISTORY */}

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                Recent conversations
              </p>

              <div className="flex flex-col gap-1">

                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleOpenChat(chat.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${activeChatId === chat.id
                        ? "bg-white/10 text-white"
                        : "text-white/55 hover:bg-white/5"
                      }`}
                  >
                    <MessageSquare size={14} className="shrink-0" />

                    <span className="truncate">
                      {chat.title}
                    </span>
                  </button>
                ))}

                {chats.length === 0 && (
                  <p className="text-xs text-white/40">
                    No conversations yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================
            MAIN CHAT AREA
        ===================================== */}

        <div className="flex min-w-0 flex-col gap-3 lg:min-h-[calc(100vh-2.5rem)]">

          {/* CHAT HEADER */}

          <div className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-amber-300/70">
                Document conversation
              </p>

              <h2 className="truncate text-xl font-bold">
                {activeChat?.title ?? "New conversation"}
              </h2>
            </div>

            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/60">
              <Sparkles size={12} className="text-amber-300" />
              AI Chat
            </span>
          </div>

          {/* ACTIVE DOCUMENTS */}

          {activeChatId && (
            <div className="flex flex-wrap gap-2">
              {selectedDocIds.map((id) => {
                const doc = documents.find((item) => item.id === id);

                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-400/5 px-2 py-1 text-[10px] text-amber-200"
                  >
                    <FileText size={11} />
                    {doc?.filename ?? "Document"}
                  </span>
                );
              })}
            </div>
          )}

          {/* MESSAGE HISTORY */}

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">

            {loadingMessages && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50">
                <Loader2 className="animate-spin" size={18} />
                Loading messages...
              </div>
            )}

            {!loadingMessages && messages.length === 0 && (
              <div className={`${glass} flex flex-1 flex-col items-center justify-center p-8 text-center`}>
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <Sparkles size={24} />
                </div>

                <h3 className="text-lg font-bold">
                  Ask your documents anything
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-6 text-white/45">
                  Select one or more documents from the sidebar,
                  start a conversation and ask questions about their content.
                </p>
              </div>
            )}

            {/* RENDER REAL MESSAGES */}

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[90%] rounded-xl rounded-br-sm bg-[#bd3864] px-4 py-3 text-sm"
                      : `${glass} max-w-full p-4 sm:max-w-[95%]`
                  }
                >
                  {message.role === "assistant" && (
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={15} className="text-amber-300" />
                      <span className="text-xs font-semibold">
                        DocuMind AI
                      </span>

                      {message.trustLevel && (
                        <span className="text-[10px] text-teal-300">
                          {message.trustLevel === "strong"
                            ? "Strong evidence"
                            : message.trustLevel === "partial"
                              ? "Partial evidence"
                              : "Not found"}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.content}
                  </p>

                  {/* REAL CITATIONS */}

                  {message.role === "assistant" &&
                    message.citations &&
                    message.citations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.citations.map((citation: Citation, index: number) => (
                          <button
                            key={citation.chunkId}
                            onClick={() => setSelectedCitation(citation)}
                            className="rounded-md border border-amber-400/25 bg-amber-400/5 px-2 py-1.5 text-left text-[10px] text-amber-200 hover:bg-amber-400/10"
                          >
                            <FileCheck size={11} className="mr-1 inline" />
                            {index + 1}. {citation.documentName} · p.
                            {citation.pageNumber}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {/* AI THINKING INDICATOR */}

            {sending && (
              <div className={`${glass} flex items-center gap-2 self-start px-4 py-3 text-xs text-white/60`}>
                <Loader2 size={15} className="animate-spin text-amber-300" />
                DocuMind AI is thinking...
              </div>
            )}
          </div>

          {/* MESSAGE INPUT */}

          <div className={`${glass} bg-black/20 p-3 sm:p-3.5`}>
            <textarea
              rows={2}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Ask anything about your documents..."
              className="max-h-32 min-h-12 w-full resize-y bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />

            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">

              <span className="text-[10px] text-white/40">
                Enter to send · Shift + Enter for new line
              </span>

              <button
                onClick={() => void handleSendMessage()}
                disabled={!question.trim() || sending || loadingMessages}
                className={`${gradBtn} flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-40`}
              >
                {sending ? "Sending..." : "Send"}
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* =====================================
            RIGHT SOURCE PANEL
        ===================================== */}

        <aside className={`${glass} min-w-0 p-3.5 sm:p-4 xl:min-h-[calc(100vh-2.5rem)]`}>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">
                Sources & References
              </h3>

              <p className="mt-1 text-[10px] text-white/40">
                Evidence from your documents
              </p>
            </div>

            <FileText size={18} className="text-white/45" />
          </div>

          <div className="mt-4 flex flex-col gap-3">

            {selectedCitation ? (
              <article className="rounded-xl bg-[#f7f1e3] p-4 text-[#1b1208]">

                <div className="flex items-center gap-2 text-[10px] text-black/50">
                  <FileText size={13} />

                  <span className="break-all">
                    {selectedCitation.documentName}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-bold">
                  Page {selectedCitation.pageNumber}
                </h4>

                <p className="mt-3 text-xs leading-6">
                  {selectedCitation.excerpt}
                </p>

                <div className="mt-4 border-t border-black/10 pt-3 text-[10px] text-black/50">
                  Relevance score:{" "}
                  {(selectedCitation.relevanceScore * 100).toFixed(1)}%
                </div>
              </article>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 p-5 text-center">

                <FileText size={25} className="text-white/30" />

                <p className="mt-2 text-xs font-semibold text-white/70">
                  No source selected
                </p>

                <p className="mt-1 text-[10px] text-white/40">
                  Ask a question to see supporting citations here.
                </p>
              </div>
            )}

            {/* ALL CITATIONS FROM CURRENT CONVERSATION */}

            {allCitations.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                  All sources · {allCitations.length}
                </p>

                {allCitations.map((citation, index) => (
                  <button
                    key={`${citation.chunkId}-${index}`}
                    onClick={() => setSelectedCitation(citation)}
                    className="mb-2 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-2 text-left transition hover:bg-white/10"
                  >
                    <FileText size={14} className="shrink-0 text-amber-300" />

                    <span className="min-w-0 flex-1 truncate text-[10px]">
                      {citation.documentName}
                      <span className="block text-white/40">
                        Page {citation.pageNumber}
                      </span>
                    </span>

                    <ChevronRight size={13} className="text-white/40" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

