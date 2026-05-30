import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { ThemeName } from '@hadafino/theme';
import type { Language, CalendarType } from '@hadafino/core';

const mmkv = new MMKV({ id: 'hadafino-settings-win' });
const mmkvStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
};

interface SettingsState {
  theme: ThemeName;
  language: Language;
  calendarType: CalendarType;
  setTheme: (t: ThemeName) => void;
  setLanguage: (l: Language) => void;
  setCalendarType: (c: CalendarType) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      theme: 'light',
      language: 'fa',
      calendarType: 'jalali',
      setTheme: (t) => set((s) => { s.theme = t; }),
      setLanguage: (l) => set((s) => { s.language = l; }),
      setCalendarType: (c) => set((s) => { s.calendarType = c; }),
    })),
    { name: 'hadafino-settings-win', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
