import { Platform } from 'react-native';

export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
  clearAll(): void | Promise<void>;
}

let _storage: StorageAdapter | null = null;

export function configureStorage(adapter: StorageAdapter): void {
  _storage = adapter;
}

function getStorage(): StorageAdapter {
  if (!_storage) {
    if (Platform.OS === 'web') {
      _storage = createLocalStorageAdapter();
    } else {
      throw new Error(
        'Storage not configured. Call configureStorage() with MMKV or AsyncStorage adapter.',
      );
    }
  }
  return _storage;
}

function createLocalStorageAdapter(): StorageAdapter {
  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage might be full
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
    clearAll: () => {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
    },
  };
}

export const storage = {
  get<T>(key: string): T | null {
    const adapter = getStorage();
    const raw = adapter.getItem(key);
    if (raw === null || raw === undefined || typeof raw === 'object') return null;
    try {
      return JSON.parse(raw as string) as T;
    } catch {
      return null;
    }
  },

  getString(key: string): string | null {
    const adapter = getStorage();
    const value = adapter.getItem(key);
    if (typeof value === 'string') return value;
    return null;
  },

  set<T>(key: string, value: T): void {
    const adapter = getStorage();
    adapter.setItem(key, JSON.stringify(value));
  },

  setString(key: string, value: string): void {
    const adapter = getStorage();
    adapter.setItem(key, value);
  },

  remove(key: string): void {
    const adapter = getStorage();
    adapter.removeItem(key);
  },

  clearAll(): void {
    const adapter = getStorage();
    adapter.clearAll();
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'hadafino_token',
  AUTH_USER: 'hadafino_user',
  THEME: 'hadafino_theme',
  LANGUAGE: 'hadafino_language',
  CALENDAR_TYPE: 'hadafino_calendar_type',
  LAST_SEEN_DATE: 'hadafino_last_seen_date',
} as const;
