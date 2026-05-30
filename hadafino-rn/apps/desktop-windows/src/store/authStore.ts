import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { User } from '@hadafino/core';

const mmkv = new MMKV({ id: 'hadafino-auth-win' });
const mmkvStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setSession: (token, user) => set((s) => { s.token = token; s.user = user; s.isAuthenticated = true; }),
      updateUser: (partial) => set((s) => { if (s.user) Object.assign(s.user, partial); }),
      clearSession: () => set((s) => { s.token = null; s.user = null; s.isAuthenticated = false; }),
    })),
    {
      name: 'hadafino-auth-win',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
