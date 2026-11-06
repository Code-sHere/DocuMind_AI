
import type { Chat, Message } from "@/types/chat";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

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
export async function createChat(documentIds: string[]): Promise<Chat> {
  const response = await fetch(`${API_URL}/chats`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documentIds }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to create chat");
  }

  return normalizeChat(data.chat);
}

// Get all previous chats
export async function getChats(): Promise<Chat[]> {
  const response = await fetch(`${API_URL}/chats`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load chats");
  }

  return (data.chats || []).map(normalizeChat);
}

// Get messages belonging to one chat
export async function getChatMessages(chatId: string): Promise<Message[]> {
  if (!chatId) {
    throw new Error("Chat ID is required.");
  }

  const response = await fetch(
    `${API_URL}/chats/${encodeURIComponent(chatId)}/messages`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load messages");
  }

  return (data.messages || []).map(normalizeMessage);
}

// Send a question to the RAG pipeline
export async function sendChatMessage(
  chatId: string,
  content: string
): Promise<Message> {
  if (!chatId) {
    throw new Error("Chat ID is required.");
  }

  const response = await fetch(
    `${API_URL}/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to send message");
  }

  // Current backend response structure
  const assistantMessage =
    data.data?.assistantMessage ??
    data.message?.assistantMessage ??
    data.message ??
    data.assistantMessage;

  if (!assistantMessage || typeof assistantMessage !== "object") {
    throw new Error("Invalid assistant message response.");
  }

  return normalizeMessage(assistantMessage);
}
