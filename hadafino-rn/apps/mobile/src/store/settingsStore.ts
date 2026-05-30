import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { ThemeName } from '@hadafino/theme';
import type { Language, CalendarType } from '@hadafino/core';

const mmkv = new MMKV({ id: 'hadafino-settings' });

const mmkvStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};

interface SettingsState {
  theme: ThemeName;
  language: Language;
  calendarType: CalendarType;
  setTheme: (theme: ThemeName) => void;
  setLanguage: (lang: Language) => void;
  setCalendarType: (type: CalendarType) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      theme: 'light',
      language: 'fa',
      calendarType: 'jalali',

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }),

      setLanguage: (lang) =>
        set((state) => {
          state.language = lang;
        }),

      setCalendarType: (type) =>
        set((state) => {
          state.calendarType = type;
        }),
    })),
    {
      name: 'hadafino-settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
