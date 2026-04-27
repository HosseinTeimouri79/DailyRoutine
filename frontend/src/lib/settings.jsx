import { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "dr_theme";
const LANGUAGE_KEY = "dr_language";
const CALENDAR_TYPE_KEY = "dr_calendar_type";

function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light";
}

function normalizeLanguage(value) {
  return value === "en" ? "en" : "fa";
}

function normalizeCalendarType(value) {
  return value === "gregorian" ? "gregorian" : "jalali";
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

export function getSavedCalendarType() {
  if (typeof window === "undefined") return "jalali";

  const saved = sessionStorage.getItem(CALENDAR_TYPE_KEY);
  if (saved) return normalizeCalendarType(saved);

  const rawUser = localStorage.getItem("dr_user");
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      return normalizeCalendarType(parsed?.calendar_type);
    } catch {
      return "jalali";
    }
  }

  return "jalali";
}

export function setCalendarTypeStorage(calendarType) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    CALENDAR_TYPE_KEY,
    normalizeCalendarType(calendarType),
  );
}

export function applyAppSettings({ theme, language, calendarType }) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", normalizeTheme(theme));
  document.documentElement.lang = normalizeLanguage(language);
  document.documentElement.dir =
    normalizeLanguage(language) === "fa" ? "rtl" : "ltr";
  document.documentElement.setAttribute(
    "data-calendar",
    normalizeCalendarType(calendarType),
  );
}

export function initAppSettings() {
  applyAppSettings({
    theme: getSavedTheme(),
    language: getSavedLanguage(),
    calendarType: getSavedCalendarType(),
  });
}

const SettingsContext = createContext({
  theme: "light",
  language: "fa",
  calendarType: "jalali",
  setTheme: () => {},
  setLanguage: () => {},
  setCalendarType: () => {},
});

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(getSavedTheme());
  const [language, setLanguageState] = useState(getSavedLanguage());
  const [calendarType, setCalendarTypeState] = useState(getSavedCalendarType());

  useEffect(() => {
    applyAppSettings({ theme, language, calendarType });
    setThemeStorage(theme);
    setLanguageStorage(language);
    setCalendarTypeStorage(calendarType);
  }, [theme, language, calendarType]);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        calendarType,
        setTheme: setThemeState,
        setLanguage: setLanguageState,
        setCalendarType: setCalendarTypeState,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
