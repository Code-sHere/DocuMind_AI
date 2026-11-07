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
  ChevronRight,
  Sparkles,
  Loader2,
  FileCheck,
} from "lucide-react";
import { createChat, getChatMessages, getChats, sendChatMessage } from "@/lib/api/chat";
import { toast } from "sonner";
import { Message } from "@/types/chat";
import Sidebar from "@/app/(app)/layout";
 
interface Citation {
  chunkId: string;
  documentName: string;
  pageNumber: number;
}
 
// Uses the .glass and .btn-gradient classes from globals.css,
// so every theme (ember, emerald, daylight) is handled automatically.
const glass = "glass";
 
// Softer surface used for cards that sit INSIDE the blurred middle panel.
const inner =
  "rounded-xl border border-border bg-background/50 backdrop-blur-md";
 
const gradBtn = "btn-gradient rounded-lg transition active:scale-[0.98]";
 
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
          getChats(),
        ]);
 
        setDocuments(documentRsult.documents);
        setChats(chatResult);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
 
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
    });
  };
 
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
  };
 
  // open an existing chat
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
  };
 
  // start a new conversation
  const handleNewConversation = () => {
    setActiveChatId(null);
    setMessages([]);
    setQuestion("");
    setSelectedCitation(null);
    setMenuOpen(false);
  };
 
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
      setMessages((previous) => [...previous, assistantMessage]);
 
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
 
  return (
    <>
      {/* Remove this line if (app)/layout.tsx already renders the top bar. */}
      <Sidebar />
 
      {/* pt-28 clears the fixed top bar. Height is automatic: the page grows with its content. */}
      <main className="min-h-screen overflow-x-hidden px-3 pb-5 pt-28 text-foreground sm:px-4 lg:px-5">
        <section className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px]">
          {/* =====================================
              LEFT SIDEBAR
          ===================================== */}
 
          <aside
            className={`${glass} flex min-w-0 flex-col gap-4 p-3.5 sm:p-4 h-fit`}
          >
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">
                DocuMind <span className="text-primary">AI</span>
              </h1>
 
              <button
                onClick={() => setMenuOpen((previous) => !previous)}
                className="rounded-lg border border-border p-2 lg:hidden"
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
 
            <div
              className={`${menuOpen ? "flex" : "hidden"} flex-col gap-5 lg:flex`}
            >
              {/* DOCUMENT SELECTION */}
 
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="section-label !text-[10px]">Select documents</p>
 
                  <span className="text-[10px] font-semibold text-primary">
                    {selectedDocIds.length} selected
                  </span>
                </div>
 
                {loading ? (
                  <Loader2 className="animate-spin text-primary" size={18} />
                ) : (
                  <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                    {documents.map((doc) => {
                      const documentId = doc.id;
                      const isReady = doc.status === "ready";
                      const isSelected = selectedDocIds.includes(documentId);
 
                      return (
                        <label
                          key={documentId}
                          className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-2 transition ${
                            isSelected
                              ? "border-primary/50 bg-primary/10"
                              : "border-border bg-muted hover:bg-secondary"
                          } ${!isReady ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isReady}
                            onChange={() => toggleDocument(documentId)}
                            className="accent-primary"
                          />
 
                          <FileText
                            size={15}
                            className="shrink-0 text-primary"
                          />
 
                          <span className="min-w-0 flex-1 truncate text-xs">
                            {doc.filename}
                          </span>
 
                          {!isReady && (
                            <span className="text-[9px] text-muted-foreground">
                              {doc.status}
                            </span>
                          )}
                        </label>
                      );
                    })}
 
                    {documents.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No uploaded documents found.
                      </p>
                    )}
                  </div>
                )}
 
                {/* CREATE CHAT USING SELECTED FILES */}
 
                <button
                  onClick={handleCreateChat}
                  disabled={selectedDocIds.length === 0 || creatingChat}
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
                <p className="section-label mb-2 !text-[10px]">
                  Recent conversations
                </p>
 
                <div className="flex flex-col gap-1">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleOpenChat(chat.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        activeChatId === chat.id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <MessageSquare size={14} className="shrink-0" />
 
                      <span className="truncate">{chat.title}</span>
                    </button>
                  ))}
 
                  {chats.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No conversations yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
 
          {/* =====================================
              MAIN CHAT AREA (blurred glass panel)
          ===================================== */}
 
          <div
            className={`${glass} flex min-w-0 flex-col gap-3 p-3 sm:p-4 lg:min-h-[60vh] backdrop-blur-3xl saturate-100`}
          >
            {/* CHAT HEADER */}
 
            <div className={`flex items-center justify-between gap-2 `}>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Document conversation
                </p>
 
                <h2 className="truncate text-xl font-bold">
                  {activeChat?.title ?? "New conversation"}
                </h2>
              </div>
 
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1.5 text-[10px] text-muted-foreground">
                <Sparkles size={12} className="text-primary" />
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
                      className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] text-foreground"
                    >
                      <FileText size={11} className="text-primary" />
                      {doc?.filename ?? "Document"}
                    </span>
                  );
                })}
              </div>
            )}
 
            {/* MESSAGE HISTORY */}
 
            <div className="flex flex-1 flex-col gap-4">
              {loadingMessages && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" size={18} />
                  Loading messages...
                </div>
              )}
 
              {!loadingMessages && messages.length === 0 && (
                <div
                  className={`${inner} flex flex-1 flex-col items-center justify-center p-8 text-center`}
                >
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles size={24} />
                  </div>
 
                  <h3 className="text-lg font-bold">
                    Ask your documents anything
                  </h3>
 
                  <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
                    Select one or more documents from the sidebar, start a
                    conversation and ask questions about their content.
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
                        ? "max-w-[90%] rounded-xl rounded-br-sm bg-bubble px-4 py-3 text-sm text-bubble-foreground"
                        : `${inner} max-w-full p-4 sm:max-w-[95%]`
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles size={15} className="text-primary" />
                        <span className="text-xs font-semibold">
                          DocuMind AI
                        </span>
 
                        {message.trustLevel && (
                          <span className="text-[10px] font-medium text-success">
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
                          {message.citations.map(
                            (citation: Citation, index: number) => (
                              <button
                                key={citation.chunkId}
                                onClick={() => setSelectedCitation(citation)}
                                className="rounded-md border border-citation/50 bg-citation/15 px-2 py-1.5 text-left text-[10px] text-foreground transition hover:bg-citation/30"
                              >
                                <FileCheck
                                  size={11}
                                  className="mr-1 inline text-primary"
                                />
                                {index + 1}. {citation.documentName} · p.
                                {citation.pageNumber}
                              </button>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))}
 
              {/* AI THINKING INDICATOR */}
 
              {sending && (
                <div
                  className={`${inner} flex items-center gap-2 self-start px-4 py-3 text-xs text-muted-foreground`}
                >
                  <Loader2 size={15} className="animate-spin text-primary" />
                  DocuMind AI is thinking...
                </div>
              )}
            </div>
 
            {/* MESSAGE INPUT */}
 
            <div className={`${inner} sticky bottom-3 z-10 p-3 sm:p-3.5`}>
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
                className="max-h-32 min-h-12 w-full resize-y bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
 
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-[10px] text-muted-foreground">
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
 
          <aside
            className={`${glass} hidden min-w-0 p-3.5 xl:block h-fit`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Sources & References</h3>
 
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Evidence from your documents
                </p>
              </div>
 
              <FileText size={18} className="text-muted-foreground" />
            </div>
 
            <div className="mt-4 flex flex-col gap-3">
              {selectedCitation ? (
                // Intentionally "paper"-coloured in every theme, like a real page.
                <article className="rounded-xl border border-border bg-[#f7f1e3] p-4 text-[#1b1208]">
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
                <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border p-5 text-center">
                  <FileText size={25} className="text-muted-foreground" />
 
                  <p className="mt-2 text-xs font-semibold text-foreground">
                    No source selected
                  </p>
 
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Ask a question to see supporting citations here.
                  </p>
                </div>
              )}
 
              {/* ALL CITATIONS FROM CURRENT CONVERSATION */}
 
              {allCitations.length > 0 && (
                <div>
                  <p className="section-label mb-2 !text-[10px]">
                    All sources · {allCitations.length}
                  </p>
 
                  {allCitations.map((citation, index) => (
                    <button
                      key={`${citation.chunkId}-${index}`}
                      onClick={() => setSelectedCitation(citation)}
                      className="mb-2 flex w-full items-center gap-2 rounded-lg border border-border bg-muted p-2 text-left transition hover:bg-secondary"
                    >
                      <FileText size={14} className="shrink-0 text-primary" />
 
                      <span className="min-w-0 flex-1 truncate text-[10px]">
                        {citation.documentName}
                        <span className="block text-muted-foreground">
                          Page {citation.pageNumber}
                        </span>
                      </span>
 
                      <ChevronRight
                        size={13}
                        className="text-muted-foreground"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}
 