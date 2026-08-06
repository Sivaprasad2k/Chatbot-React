export type SenderRole = 'user' | 'assistant' | 'system';

export interface DocMeta {
  name: string;
  size: string;
  text: string;
}

export interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'pdf' | 'text';
}

export interface Message {
  id: string;
  sender: SenderRole;
  content: string;
  timestamp: number;
  modelId?: string;
  previews?: string[];
  docMeta?: DocMeta | null;
  isStreaming?: boolean;
  error?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  modelId: string;
}

export interface UserPreferences {
  activeThreadId: string;
  selectedModelId: string;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
}
