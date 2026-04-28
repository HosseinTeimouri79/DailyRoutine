const hasOwn = Object.prototype.hasOwnProperty;

export const LANGUAGE_DEFINITIONS = {
  fa: {
    label: "فارسی",
    shortLabel: "FA",
    dir: "rtl",
  },
  en: {
    label: "English",
    shortLabel: "EN",
    dir: "ltr",
  },
};

export const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_DEFINITIONS).map(
  ([value, language]) => ({
    value,
    label: language.label,
  }),
);

export function isLanguage(value) {
  return Boolean(value && hasOwn.call(LANGUAGE_DEFINITIONS, value));
}

export function normalizeLanguage(value) {
  return isLanguage(value) ? value : "fa";
}

export function getLanguageLabel(language) {
  return LANGUAGE_DEFINITIONS[normalizeLanguage(language)]?.label || "فارسی";
}

export function getLanguageMeta(language) {
  return (
    LANGUAGE_DEFINITIONS[normalizeLanguage(language)] || LANGUAGE_DEFINITIONS.fa
  );
}
