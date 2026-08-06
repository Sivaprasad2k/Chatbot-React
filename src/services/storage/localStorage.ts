import { Thread, UserPreferences } from '@/types/chat';

const STORAGE_KEYS = {
  THREADS: 'avis_chat_threads',
  PREFERENCES: 'avis_user_preferences'
};

const DEFAULT_PREFERENCES: UserPreferences = {
  activeThreadId: 'default',
  selectedModelId: 'avis-core',
  isSidebarOpen: true,
  theme: 'dark'
};

const DEFAULT_THREAD: Thread = {
  id: 'default',
  title: 'New Conversation',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  modelId: 'avis-core'
};

export const storageService = {
  getThreads(): Thread[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THREADS);
      if (!data) return [DEFAULT_THREAD];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_THREAD];
    } catch (e) {
      console.error('Failed to parse chat threads from localStorage:', e);
      return [DEFAULT_THREAD];
    }
  },

  saveThreads(threads: Thread[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
    } catch (e) {
      console.error('Failed to save chat threads to localStorage:', e);
    }
  },

  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!data) return DEFAULT_PREFERENCES;
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences();
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({ ...current, ...preferences }));
    } catch (e) {
      console.error('Failed to save user preferences to localStorage:', e);
    }
  }
};
