const CONFETTI_SETTINGS_KEY = "dr_confetti_settings";

const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "basic",
};

export const CONFETTI_MODE_OPTIONS = [
  { value: "basic" },
  { value: "randomDirection" },
  { value: "realistic" },
  { value: "fireworks" },
  { value: "snow" },
  { value: "stars" },
  { value: "hearts" },
  { value: "emoji" },
  { value: "images" },
  { value: "schoolPride" },
  { value: "customShapes" },
  { value: "random" },
];

const BASE_COLORS = [
  "#2f9e44",
  "#f08c00",
  "#1864ab",
  "#f03e3e",
  "#7048e8",
  "#12b886",
];

const CONFETTI_MODE_CONFIGS = {
  basic: () => ({
    particleCount: 120,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: BASE_COLORS,
  }),
  randomDirection: () => ({
    particleCount: 110,
    spread: 110,
    startVelocity: 30,
    angle: Math.floor(Math.random() * 360),
    origin: { x: Math.random(), y: 0.65 },
    colors: BASE_COLORS,
  }),
  realistic: () => ({
    particleCount: 150,
    spread: 65,
    startVelocity: 48,
    decay: 0.9,
    gravity: 1.15,
    scalar: 1,
    origin: { y: 0.7 },
    colors: BASE_COLORS,
  }),
  fireworks: () => ({
    particleCount: 140,
    spread: 360,
    startVelocity: 55,
    decay: 0.88,
    gravity: 0.9,
    ticks: 200,
    origin: { y: 0.7 },
    colors: ["#ffd43b", "#ffa94d", "#ff6b6b", "#4dabf7"],
  }),
  snow: () => ({
    particleCount: 80,
    spread: 80,
    startVelocity: 10,
    gravity: 0.35,
    ticks: 300,
    scalar: 1.1,
    origin: { y: 0.5 },
    colors: ["#ffffff", "#e7f5ff", "#f1f3f5"],
  }),
  stars: () => ({
    particleCount: 120,
    spread: 75,
    startVelocity: 40,
    shapes: ["star"],
    origin: { y: 0.7 },
    colors: ["#ffe066", "#ffd43b", "#fff3bf"],
  }),
  hearts: () => ({
    particleCount: 110,
    spread: 70,
    startVelocity: 35,
    shapes: ["heart"],
    origin: { y: 0.7 },
    colors: ["#ff6b6b", "#ff8787", "#ffa8a8"],
  }),
  emoji: () => ({
    particleCount: 70,
    spread: 85,
    startVelocity: 30,
    scalar: 1.25,
    origin: { y: 0.7 },
    colors: ["#ffd43b", "#ffa94d", "#ff6b6b", "#63e6be"],
  }),
  images: () => ({
    particleCount: 70,
    spread: 65,
    startVelocity: 28,
    scalar: 1.2,
    origin: { y: 0.7 },
    colors: ["#74c0fc", "#b197fc", "#63e6be"],
  }),
  schoolPride: () => ({
    particleCount: 120,
    spread: 75,
    startVelocity: 40,
    origin: { y: 0.7 },
    colors: ["#002d72", "#ffc72c", "#ffffff"],
  }),
  customShapes: () => ({
    particleCount: 120,
    spread: 70,
    startVelocity: 35,
    shapes: ["square", "triangle", "circle"],
    origin: { y: 0.7 },
    colors: BASE_COLORS,
  }),
};

function normalizeConfettiMode(value) {
  const found = CONFETTI_MODE_OPTIONS.find((mode) => mode.value === value);
  return found ? found.value : DEFAULT_SETTINGS.mode;
}

export function getSavedConfettiSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  const raw = localStorage.getItem(CONFETTI_SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed?.enabled !== false,
      mode: normalizeConfettiMode(parsed?.mode),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setConfettiSettings(settings) {
  if (typeof window === "undefined") return;
  const next = {
    enabled: settings.enabled !== false,
    mode: normalizeConfettiMode(settings.mode),
  };
  localStorage.setItem(CONFETTI_SETTINGS_KEY, JSON.stringify(next));
}

function getRandomMode() {
  const options = CONFETTI_MODE_OPTIONS.filter(
    (mode) => mode.value !== "random",
  );
  return options[Math.floor(Math.random() * options.length)].value;
}

function getBaseDelayMs() {
  return 100 + Math.floor(Math.random() * 201);
}

function applyMotionPreferences(config) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return {
      ...config,
      particleCount: Math.max(20, Math.floor(config.particleCount * 0.4)),
      startVelocity: Math.max(12, Math.floor(config.startVelocity * 0.6)),
      spread: Math.min(60, config.spread || 60),
    };
  }

  return config;
}

function buildConfettiConfig(mode) {
  const build = CONFETTI_MODE_CONFIGS[mode] || CONFETTI_MODE_CONFIGS.basic;
  const base = build();
  return {
    zIndex: 1200,
    ...base,
    origin: { y: 0.7, ...(base.origin || {}) },
  };
}

export function triggerConfetti(mode) {
  if (typeof window === "undefined") return;
  const settings = getSavedConfettiSettings();
  if (!settings.enabled) return;

  const normalized = normalizeConfettiMode(mode || settings.mode);
  const selectedMode = normalized === "random" ? getRandomMode() : normalized;
  const config = applyMotionPreferences(buildConfettiConfig(selectedMode));

  const delay = getBaseDelayMs();
  window.setTimeout(() => {
    const confetti = window.confetti;
    if (typeof confetti !== "function") return;

    try {
      confetti(config);
    } catch {
      confetti(applyMotionPreferences(buildConfettiConfig("basic")));
    }
  }, delay);
}
