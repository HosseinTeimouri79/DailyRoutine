import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getTodayISO } from '@hadafino/core';
import type { SnackbarType } from '@hadafino/ui';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

interface UIState {
  selectedDate: string;
  snackbar: SnackbarState;
  syncStatus: 'idle' | 'syncing' | 'error';

  setSelectedDate: (date: string) => void;
  showSnackbar: (message: string, type?: SnackbarType) => void;
  hideSnackbar: () => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    selectedDate: getTodayISO(),
    snackbar: { visible: false, message: '', type: 'info' },
    syncStatus: 'idle',

    setSelectedDate: (date) =>
      set((state) => {
        state.selectedDate = date;
      }),

    showSnackbar: (message, type = 'info') =>
      set((state) => {
        state.snackbar = { visible: true, message, type };
      }),

    hideSnackbar: () =>
      set((state) => {
        state.snackbar.visible = false;
      }),

    setSyncStatus: (status) =>
      set((state) => {
        state.syncStatus = status;
      }),
  })),
);
