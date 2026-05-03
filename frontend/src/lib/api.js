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
    throw new Error(data.message || "Request failed");
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
  getDailyTasks: (date) => request(`/daily-tasks?date=${date}`, { auth: true }),
  getDailyTasksRange: (startDate, endDate) =>
    request(`/daily-tasks?startDate=${startDate}&endDate=${endDate}`, {
      auth: true,
    }),
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
  getNotes: (query = "") => request(`/notes${query}`, { auth: true }),
  createNote: (payload) =>
    request("/notes", { method: "POST", body: payload, auth: true }),
  updateNote: (id, payload) =>
    request(`/notes/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),
  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE", auth: true }),
  getImportantDays: () => request("/important-days", { auth: true }),
  createImportantDay: (payload) =>
    request("/important-days", { method: "POST", body: payload, auth: true }),
  updateImportantDay: (id, payload) =>
    request(`/important-days/${id}`, {
      method: "PUT",
      body: payload,
      auth: true,
    }),
  deleteImportantDay: (id) =>
    request(`/important-days/${id}`, { method: "DELETE", auth: true }),
};
