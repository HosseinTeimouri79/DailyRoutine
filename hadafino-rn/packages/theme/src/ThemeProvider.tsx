import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { THEMES, DEFAULT_THEME, isValidTheme, type ThemeName } from './themes';
import type { ThemeTokens } from './tokens';

interface ThemeContextValue {
  tokens: ThemeTokens;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
  onThemeChange?: (name: ThemeName) => void;
}

export function ThemeProvider({
  children,
  initialTheme = DEFAULT_THEME,
  onThemeChange,
}: ThemeProviderProps): React.JSX.Element {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>(
    isValidTheme(initialTheme) ? initialTheme : DEFAULT_THEME,
  );

  const setTheme = useCallback(
    (name: ThemeName) => {
      if (!isValidTheme(name)) return;
      setThemeNameState(name);
      onThemeChange?.(name);
    },
    [onThemeChange],
  );

  const tokens = useMemo(() => THEMES[themeName], [themeName]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      tokens,
      themeName,
      setTheme,
      isDark: tokens.isDark,
    }),
    [tokens, themeName, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
