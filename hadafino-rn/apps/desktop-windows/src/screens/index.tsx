// Placeholder screens — Windows app shares the same screen logic as mobile.
// In a full implementation, these would import from a shared `packages/screens`
// package or be duplicated with Windows-specific window chrome adaptations.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@hadafino/theme';

export function LoginScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bgPage }]}>
      <Text style={{ color: tokens.color.textPrimary }}>Login — Windows</Text>
    </View>
  );
}

export function MainScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: tokens.color.bgPage }]}>
      <Text style={{ color: tokens.color.textPrimary }}>Main — Windows</Text>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
