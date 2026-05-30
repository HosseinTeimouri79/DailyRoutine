export type CalendarType = 'jalali' | 'gregorian';
export type Language = 'fa' | 'en';
export type Gender = 'male' | 'female' | 'other';
export type RecurrenceMode = 'specific_weekdays' | 'weekly_day' | 'monthly_day';
export type RoutineLogStatus = 'done' | 'missed';
export type SyncOperation = 'create' | 'update' | 'delete' | 'upsert';
export type SyncableEntity =
  | 'routines'
  | 'daily_tasks'
  | 'notes'
  | 'important_days'
  | 'routine_logs';

export type ConflictStrategy = 'server-wins' | 'last-write-wins' | 'merge';

export interface User {
  readonly id: number;
  name: string;
  phone: string;
  profileImage?: string;
  dateOfBirth?: number;
  calendarType: CalendarType;
  gender?: Gender;
  isAdmin: boolean;
  readonly createdAt: number;
}

export interface Routine {
  readonly id: number;
  readonly userId: number;
  title: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  recurrenceMode: RecurrenceMode;
  recurrenceWeekdays: number[];
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  alarmEnabled: boolean;
  alarmTime?: string;
  readonly createdAt: number;
}

export interface RoutineLog {
  readonly id: number;
  readonly routineId: number;
  date: number;
  status: RoutineLogStatus;
  readonly createdAt: number;
  updatedAt: number;
}

export interface DailyTask {
  readonly id: number;
  readonly userId: number;
  taskDate: number;
  content: string;
  isDone: boolean;
  alarmEnabled: boolean;
  alarmTime?: string;
  readonly createdAt: number;
  updatedAt: number;
}

export interface Note {
  readonly id: number;
  readonly userId: number;
  content: string;
  readonly createdAt: number;
  updatedAt: number;
}

export interface ImportantDay {
  readonly id: number;
  readonly userId: number;
  title: string;
  description?: string;
  eventDate: number;
  eventTime: string;
  icon?: string;
  iconColor?: string;
  readonly createdAt: number;
  updatedAt: number;
}

export interface SyncQueueItem {
  readonly id: string;
  entity: SyncableEntity;
  operation: SyncOperation;
  localId: string;
  serverId: number | null;
  payload: string;
  readonly createdAt: number;
  retryCount: number;
  lastError: string | null;
  status: 'pending' | 'processing' | 'failed';
}

export interface SyncMetadataRecord {
  entity: SyncableEntity;
  lastSyncAt: number;
  isDirty: boolean;
}

export interface AuthCredentials {
  phone: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  name: string;
  calendarType?: CalendarType;
  gender?: Gender;
  dateOfBirth?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface RecurrenceNormalized {
  mode: RecurrenceMode;
  weekdays: number[];
  dayOfWeek: number | null;
  dayOfMonth: number | null;
}

export interface RoutineRecurrenceSummary {
  mode: RecurrenceMode;
  text: string;
}

export interface DateParts {
  day: string;
  dayName: string;
  month: string;
  year: string;
  fullDate: string;
}

export interface CalendarDay {
  isoDate: string;
  dayNumber: number | string;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  routinesDone: number;
  routinesMissed: number;
  routinesTotal: number;
  tasksDone: number;
  tasksTotal: number;
  hasImportantDay: boolean;
}

export interface RoutineStats {
  total: number;
  done: number;
  missed: number;
  remaining: number;
  percent: number;
  currentStreak: number;
  maxStreak: number;
}

export interface AlarmItem {
  id: string;
  title: string;
  body: string;
  time: string;
  entityType: 'routine' | 'task';
}
