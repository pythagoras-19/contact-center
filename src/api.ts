export interface Message {
  id: string;
  chatId: string;
  customerName: string;
  message: string;
  timestamp: string;
}

export interface Chat {
  chatId: string;
  customerName: string;
  message: string;
  timestamp: string;
}

const API_URL = 'http://localhost:4000';

export async function getChats(): Promise<Chat[]> {
  const res = await fetch(`${API_URL}/chats`);
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export async function getMessagesForChat(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}/chats/${chatId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages for chat');
  return res.json();
}

export async function sendMessageToChat(chatId: string, customerName: string, message: string): Promise<Message> {
  const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, message })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
} 