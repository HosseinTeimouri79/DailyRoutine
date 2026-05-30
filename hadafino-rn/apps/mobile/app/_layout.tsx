import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppProviders } from '../src/providers/AppProviders';
import { Snackbar } from '@hadafino/ui';
import { useUIStore } from '../src/store/uiStore';
import { useAuthStore } from '../src/store/authStore';
import { useRouter, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@hadafino/theme';

function AuthGuard(): null {
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [isAuthenticated, segments, router]);

  return null;
}

function RootContent(): React.JSX.Element {
  const { tokens } = useTheme();
  const { snackbar, hideSnackbar } = useUIStore();

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bgPage }]}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
    </View>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <RootContent />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
