import type { Chat, Message } from "@/types/chat";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

// Create a chat using selected document IDs
export async function createChat(documentIds: string[]): Promise<Chat> {
  const response = await fetch(`${API_URL}/chats`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentIds }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to create chat");
  }

  return data.chat;
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

  return data.chats;
}

// Get messages belonging to one chat
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const response = await fetch(
    `${API_URL}/chats/${chatId}/messages`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load messages");
  }

  return data.messages;
}

// Send a question to the RAG pipeline
export async function sendChatMessage(
  chatId: string,
  content: string
): Promise<Message> {
  const response = await fetch(
    `${API_URL}/chats/${chatId}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to send message");
  }

  return data.message;
}