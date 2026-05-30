import { spacing, radius, typography } from '../tokens';
import {
  LIGHT_COLORS,
  DARK_COLORS,
  ATLASI_COLORS,
  MATCHA_COLORS,
  MOONLIGHT_COLORS,
  DAWN_COLORS,
} from './colors';
import type { ThemeTokens } from '../tokens';

function buildTheme(colors: typeof LIGHT_COLORS, isDark: boolean): ThemeTokens {
  return { color: colors, spacing, radius, typography, isDark };
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  light: buildTheme(LIGHT_COLORS, false),
  dark: buildTheme(DARK_COLORS, true),
  atlasi: buildTheme(ATLASI_COLORS, false),
  'matcha-green': buildTheme(MATCHA_COLORS, false),
  moonlight: buildTheme(MOONLIGHT_COLORS, true),
  dawn: buildTheme(DAWN_COLORS, false),
};

export type ThemeName = 'light' | 'dark' | 'atlasi' | 'matcha-green' | 'moonlight' | 'dawn';

export const THEME_OPTIONS: Array<{ value: ThemeName; label: string; isDark: boolean }> = [
  { value: 'light', label: 'Light', isDark: false },
  { value: 'dark', label: 'Dark', isDark: true },
  { value: 'atlasi', label: 'Atlasi', isDark: false },
  { value: 'matcha-green', label: 'Matcha Green', isDark: false },
  { value: 'moonlight', label: 'Moonlight', isDark: true },
  { value: 'dawn', label: 'Dawn', isDark: false },
];

export const DEFAULT_THEME: ThemeName = 'light';

export function isValidTheme(value: unknown): value is ThemeName {
  return typeof value === 'string' && value in THEMES;
}
