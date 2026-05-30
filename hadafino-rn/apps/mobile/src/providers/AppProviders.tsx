import React, { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@hadafino/theme';
import { initI18n } from '@hadafino/i18n';
import {
  initDatabase,
  configureApiClient,
  configureStorage,
  SyncEngine,
} from '@hadafino/core';
import { MMKV } from 'react-native-mmkv';
import { StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
      retry: 0,
    },
  },
});

const mmkv = new MMKV({ id: 'hadafino-core' });

function BootstrapEffect(): null {
  const { theme, language } = useSettingsStore();
  const { token } = useAuthStore();
  const { setSyncStatus } = useUIStore();

  useEffect(() => {
    // Initialize database
    initDatabase();

    // Configure storage adapter
    configureStorage({
      getItem: (key) => mmkv.getString(key) ?? null,
      setItem: (key, value) => mmkv.set(key, value),
      removeItem: (key) => mmkv.delete(key),
      clearAll: () => mmkv.clearAll(),
    });

    // Configure API
    const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    configureApiClient(API_BASE, () => useAuthStore.getState().token);

    // Init i18n
    void initI18n(language);

    // Configure sync engine
    SyncEngine.configure({
      getIsOnline: () => true,
      onSyncStatusChange: (status) => {
        setSyncStatus(status.type === 'syncing' ? 'syncing' : status.type === 'error' ? 'error' : 'idle');
      },
    });

    // Monitor network
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        void SyncEngine.syncOnReconnect();
      }
    });

    // Start auto sync
    if (token) {
      SyncEngine.startAutoSync();
    }

    return () => {
      unsubscribe();
      SyncEngine.stopAutoSync();
    };
  }, []);

  // Re-init i18n when language changes
  useEffect(() => {
    void initI18n(language);
  }, [language]);

  // Restart sync when auth changes
  useEffect(() => {
    if (token) {
      SyncEngine.startAutoSync();
    } else {
      SyncEngine.stopAutoSync();
    }
  }, [token]);

  return null;
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  const { theme } = useSettingsStore();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialTheme={theme} onThemeChange={useSettingsStore.getState().setTheme}>
            <BootstrapEffect />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
