const TOKEN_KEY = "dr_token";
const USER_KEY = "dr_user";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000/api`;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "خطا در درخواست");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  getProfile: () => request("/auth/me", { auth: true }),
  updateProfile: (payload) =>
    request("/auth/profile", { method: "PUT", body: payload, auth: true }),
  changePassword: (payload) =>
    request("/auth/change-password", {
      method: "POST",
      body: payload,
      auth: true,
    }),
  getRoutines: () => request("/routines", { auth: true }),
  createRoutine: (payload) =>
    request("/routines", { method: "POST", body: payload, auth: true }),
  updateRoutine: (id, payload) =>
    request(`/routines/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteRoutine: (id) =>
    request(`/routines/${id}`, { method: "DELETE", auth: true }),
  upsertLog: (payload) =>
    request("/routine-logs", { method: "POST", body: payload, auth: true }),
  getLogs: (query = "") => request(`/routine-logs${query}`, { auth: true }),
  getMonthlyReport: (month) =>
    request(`/reports/monthly?month=${month}`, { auth: true }),
  getWeeklyReport: () => request("/reports/weekly", { auth: true }),
  getDailyTasks: (date) => request(`/daily-tasks?date=${date}`, { auth: true }),
  createDailyTask: (payload) =>
    request("/daily-tasks", { method: "POST", body: payload, auth: true }),
  updateDailyTask: (id, payload) =>
    request(`/daily-tasks/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),
  deleteDailyTask: (id) =>
    request(`/daily-tasks/${id}`, { method: "DELETE", auth: true }),
};
