import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { User } from '@hadafino/core';

const mmkv = new MMKV({ id: 'hadafino-auth' });

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

      setSession: (token, user) =>
        set((state) => {
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
        }),

      updateUser: (partial) =>
        set((state) => {
          if (state.user) {
            Object.assign(state.user, partial);
          }
        }),

      clearSession: () =>
        set((state) => {
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
        }),
    })),
    {
      name: 'hadafino-auth-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
