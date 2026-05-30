import React, { memo, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@hadafino/theme';

export type SnackbarType = 'info' | 'success' | 'warn' | 'error';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 3500;

export const Snackbar = memo(function Snackbar({
  visible,
  message,
  type = 'info',
  duration = AUTO_DISMISS_MS,
  onDismiss,
}: SnackbarProps): React.JSX.Element | null {
  const { tokens } = useTheme();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });

      const timeout = setTimeout(dismiss, duration);
      return () => clearTimeout(timeout);
    }
  }, [visible, duration, dismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const colorMap: Record<SnackbarType, string> = {
    info: tokens.color.snackbarInfo,
    success: tokens.color.snackbarSuccess,
    warn: tokens.color.snackbarWarn,
    error: tokens.color.snackbarError,
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colorMap[type],
          borderRadius: tokens.radius.md,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[styles.message, { color: '#ffffff', fontSize: tokens.typography.fontSize.sm }]}
        numberOfLines={3}
      >
        {message}
      </Text>
      <Pressable onPress={dismiss} style={styles.closeBtn} accessibilityRole="button">
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
  },
});
