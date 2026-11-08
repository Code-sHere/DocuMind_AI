import { defaultRequest, type ApiRequest } from "./client";
import type { Chat, Message } from "@/types/chat";

// Normalize MongoDB chat ID (_id) to frontend id
function normalizeChat(chat: any): Chat {
  const id = chat?.id ?? chat?._id;

  if (!id) {
    throw new Error("Chat response is missing its ID.");
  }

  return {
    ...chat,
    id: String(id),
  } as Chat;
}

// Normalize MongoDB message ID (_id) to frontend id
function normalizeMessage(message: any): Message {
  const id = message?.id ?? message?._id;

  if (!id) {
    throw new Error("Message response is missing its ID.");
  }

  return {
    ...message,
    id: String(id),
  } as Message;
}

// Create a chat using selected document IDs
export async function createChat(
  documentIds: string[],
  request: ApiRequest = defaultRequest
): Promise<Chat> {
  const data = await request<{ success: boolean; chat: any }>("/chats", {
    method: "POST",
    body: JSON.stringify({ documentIds }),
  });

  return normalizeChat(data.chat);
}

// Get all previous chats
export async function getChats(
  request: ApiRequest = defaultRequest
): Promise<Chat[]> {
  const data = await request<{ success: boolean; chats: any[] }>("/chats", {
    cache: "no-store",
  });

  return (data.chats || []).map(normalizeChat);
}

// Get messages belonging to one chat
export async function getChatMessages(
  chatId: string,
  request: ApiRequest = defaultRequest
): Promise<Message[]> {
  if (!chatId) {
    throw new Error("Chat ID is required.");
  }

  const data = await request<{ success: boolean; messages: any[] }>(
    `/chats/${encodeURIComponent(chatId)}/messages`,
    { cache: "no-store" }
  );

  return (data.messages || []).map(normalizeMessage);
}

// Send a question to the RAG pipeline
export async function sendChatMessage(
  chatId: string,
  content: string,
  request: ApiRequest = defaultRequest
): Promise<Message> {
  if (!chatId) {
    throw new Error("Chat ID is required.");
  }

  const data = await request<{
    success: boolean;
    data?: { userMessage?: any; assistantMessage?: any };
  }>(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  const assistantMessage = data.data?.assistantMessage;

  if (!assistantMessage || typeof assistantMessage !== "object") {
    throw new Error("Invalid assistant message response.");
  }

  return normalizeMessage(assistantMessage);
}