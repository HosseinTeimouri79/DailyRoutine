import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@hadafino/theme';
import { initI18n } from '@hadafino/i18n';
import { initDatabase, configureApiClient, configureStorage, SyncEngine } from '@hadafino/core';
import { MMKV } from 'react-native-mmkv';
import { useSettingsStore } from './store/settingsStore';
import { useAuthStore } from './store/authStore';
import { RootNavigator } from './navigation/RootNavigator';

const mmkv = new MMKV({ id: 'hadafino-windows' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

// Bootstrap once
initDatabase();
configureStorage({
  getItem: (k) => mmkv.getString(k) ?? null,
  setItem: (k, v) => mmkv.set(k, v),
  removeItem: (k) => mmkv.delete(k),
  clearAll: () => mmkv.clearAll(),
});
const API_BASE = process.env.HADAFINO_API_URL ?? 'http://localhost:4000/api';
configureApiClient(API_BASE, () => useAuthStore.getState().token);
void initI18n(useSettingsStore.getState().language);

export default function App(): React.JSX.Element {
  const { theme } = useSettingsStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialTheme={theme} onThemeChange={useSettingsStore.getState().setTheme}>
        <View style={styles.root}>
          <RootNavigator />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
