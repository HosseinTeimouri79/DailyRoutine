import type {
  AuthCredentials,
  AuthResponse,
  DailyTask,
  ImportantDay,
  Note,
  RegisterPayload,
  Routine,
  RoutineLog,
  SyncableEntity,
  User,
} from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly serverRecord?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

type TokenProvider = () => string | null;

let _baseUrl = 'http://localhost:4000/api';
let _getToken: TokenProvider = () => null;

export function configureApiClient(baseUrl: string, getToken: TokenProvider): void {
  _baseUrl = baseUrl.replace(/\/$/, '');
  _getToken = getToken;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  if (auth) {
    const token = _getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${_baseUrl}${path}`, {
    ...fetchOptions,
    headers,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String((data as Record<string, unknown>).message)
      : `HTTP ${response.status}`;
    const serverRecord = typeof data === 'object' && data !== null && 'record' in data
      ? (data as Record<string, unknown>).record
      : undefined;
    throw new ApiError(message, response.status, serverRecord);
  }

  return data as T;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET', auth: true });
}

function post<T>(path: string, body: unknown, auth = true): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    auth,
  });
}

function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
    auth: true,
  });
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE', auth: true });
}

export const apiClient = {
  auth: {
    login: (payload: AuthCredentials) =>
      post<AuthResponse>('/auth/login', payload, false),
    register: (payload: RegisterPayload) =>
      post<AuthResponse>('/auth/register', payload, false),
    getProfile: () => get<User>('/auth/me'),
    updateProfile: (payload: Partial<User>) => put<User>('/auth/profile', payload),
    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
      post<{ message: string }>('/auth/change-password', payload),
  },

  routines: {
    getAll: () => get<Routine[]>('/routines'),
    create: (payload: Omit<Routine, 'id' | 'userId' | 'createdAt'>) =>
      post<Routine>('/routines', payload),
    update: (id: number, payload: Partial<Routine>) => put<Routine>(`/routines/${id}`, payload),
    delete: (id: number) => del<{ message: string }>(`/routines/${id}`),
  },

  routineLogs: {
    getAll: (query = '') => get<RoutineLog[]>(`/routine-logs${query}`),
    upsert: (payload: Pick<RoutineLog, 'routineId' | 'date' | 'status'>) =>
      post<RoutineLog>('/routine-logs', payload),
    getChangedSince: (since: number) =>
      get<RoutineLog[]>(`/routine-logs?since=${since}`),
  },

  dailyTasks: {
    getByDate: (date: number) => get<DailyTask[]>(`/daily-tasks?date=${date}`),
    getRange: (startDate: number, endDate: number) =>
      get<DailyTask[]>(`/daily-tasks?startDate=${startDate}&endDate=${endDate}`),
    create: (payload: Omit<DailyTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      post<DailyTask>('/daily-tasks', payload),
    update: (id: number, payload: Partial<DailyTask>) =>
      put<DailyTask>(`/daily-tasks/${id}`, payload),
    delete: (id: number) => del<{ message: string }>(`/daily-tasks/${id}`),
    getChangedSince: (since: number) =>
      get<DailyTask[]>(`/daily-tasks?since=${since}`),
  },

  notes: {
    getAll: (query = '') => get<Note[]>(`/notes${query}`),
    create: (payload: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      post<Note>('/notes', payload),
    update: (id: number, payload: Partial<Note>) => put<Note>(`/notes/${id}`, payload),
    delete: (id: number) => del<{ message: string }>(`/notes/${id}`),
    getChangedSince: (since: number) => get<Note[]>(`/notes?since=${since}`),
  },

  importantDays: {
    getAll: () => get<ImportantDay[]>('/important-days'),
    create: (payload: Omit<ImportantDay, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      post<ImportantDay>('/important-days', payload),
    update: (id: number, payload: Partial<ImportantDay>) =>
      put<ImportantDay>(`/important-days/${id}`, payload),
    delete: (id: number) => del<{ message: string }>(`/important-days/${id}`),
    getChangedSince: (since: number) =>
      get<ImportantDay[]>(`/important-days?since=${since}`),
    getGlobal: () => get<ImportantDay | null>('/important-days/global'),
    upsertGlobal: (payload: Partial<ImportantDay>) =>
      put<ImportantDay>('/important-days/global', payload),
    deleteGlobal: () => del<{ message: string }>('/important-days/global'),
  },

  health: {
    check: () =>
      fetch(`${_baseUrl}/health`)
        .then((r) => r.ok)
        .catch(() => false),
  },

  sync: {
    getChangedSince: (entity: SyncableEntity, since: number) => {
      const paths: Record<SyncableEntity, string> = {
        routines: `/routines?since=${since}`,
        daily_tasks: `/daily-tasks?since=${since}`,
        notes: `/notes?since=${since}`,
        important_days: `/important-days?since=${since}`,
        routine_logs: `/routine-logs?since=${since}`,
      };
      return get<unknown[]>(paths[entity]);
    },
  },
};
