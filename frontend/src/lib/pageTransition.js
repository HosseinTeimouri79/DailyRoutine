const PAGE_TRANSITION_SETTINGS_KEY = "dr_page_transition_settings";

export const PAGE_TRANSITION_MODE_OPTIONS = [
  { value: "fade" },
  { value: "slide" },
  { value: "zoom" },
  { value: "sparkle" },
  { value: "swirl" },
  { value: "blur" },
  { value: "tilt" },
  { value: "flip" },
  { value: "skew" },
];

const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "fade",
};

function normalizePageTransitionMode(value) {
  return PAGE_TRANSITION_MODE_OPTIONS.some((item) => item.value === value)
    ? value
    : DEFAULT_SETTINGS.mode;
}

export function getSavedPageTransitionSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  const raw = localStorage.getItem(PAGE_TRANSITION_SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed?.enabled !== false,
      mode: normalizePageTransitionMode(parsed?.mode),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setPageTransitionSettings(settings) {
  if (typeof window === "undefined") return;
  const next = {
    enabled: settings.enabled !== false,
    mode: normalizePageTransitionMode(settings.mode),
  };
  localStorage.setItem(PAGE_TRANSITION_SETTINGS_KEY, JSON.stringify(next));
}
