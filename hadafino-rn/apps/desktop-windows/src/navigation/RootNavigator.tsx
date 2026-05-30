import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/LoginScreen';
import { MainScreen } from '../screens/MainScreen';

export function RootNavigator(): React.JSX.Element {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <MainScreen /> : <LoginScreen />;
}
