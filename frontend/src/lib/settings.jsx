import { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "dr_theme";
const LANGUAGE_KEY = "dr_language";

function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}

function normalizeLanguage(value) {
  return value === "en" ? "en" : "fa";
}

export function getSavedTheme() {
  if (typeof window === "undefined") return "light";
  const saved = sessionStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setThemeStorage(theme) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(THEME_KEY, normalizeTheme(theme));
}

export function getSavedLanguage() {
  if (typeof window === "undefined") return "fa";
  const saved = sessionStorage.getItem(LANGUAGE_KEY);
  return normalizeLanguage(saved);
}

export function setLanguageStorage(language) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LANGUAGE_KEY, normalizeLanguage(language));
}

export function applyAppSettings({ theme, language }) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", normalizeTheme(theme));
  document.documentElement.lang = normalizeLanguage(language);
  document.documentElement.dir = normalizeLanguage(language) === "fa" ? "rtl" : "ltr";
}

export function initAppSettings() {
  applyAppSettings({
    theme: getSavedTheme(),
    language: getSavedLanguage(),
  });
}

const SettingsContext = createContext({
  theme: "light",
  language: "fa",
  setTheme: () => {},
  setLanguage: () => {},
});

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(getSavedTheme());
  const [language, setLanguageState] = useState(getSavedLanguage());

  useEffect(() => {
    applyAppSettings({ theme, language });
    setThemeStorage(theme);
    setLanguageStorage(language);
  }, [theme, language]);

  return (
    <SettingsContext.Provider
      value={{ theme, language, setTheme: setThemeState, setLanguage: setLanguageState }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
