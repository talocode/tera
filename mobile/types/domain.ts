export type TeraMode = 'learn' | 'research' | 'build';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'plus' | 'pro';
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status?: 'sending' | 'streaming' | 'sent' | 'failed';
}

export interface Conversation {
  id: string;
  title: string;
  mode: TeraMode;
  summary: string;
  updatedAt: string;
  isSaved: boolean;
  messages: Message[];
}

export interface SavedItem {
  id: string;
  conversationId: string;
  title: string;
  excerpt: string;
  mode: TeraMode;
  savedAt: string;
}
