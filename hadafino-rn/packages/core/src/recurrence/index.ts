import type { RecurrenceMode, RecurrenceNormalized, RoutineRecurrenceSummary } from '../types';

export const RECURRENCE_MODES = {
  SPECIFIC_WEEKDAYS: 'specific_weekdays' as RecurrenceMode,
  WEEKLY_DAY: 'weekly_day' as RecurrenceMode,
  MONTHLY_DAY: 'monthly_day' as RecurrenceMode,
} as const;

export const ALL_WEEKDAYS: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6];

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function normalizeWeekdays(weekdays: unknown): number[] {
  if (!Array.isArray(weekdays)) return [];
  const result = [
    ...new Set(
      weekdays
        .map(toInt)
        .filter((day): day is number => day !== null && day >= 0 && day <= 6),
    ),
  ].sort((a, b) => a - b);
  return result;
}

interface RoutineLike {
  recurrenceMode?: RecurrenceMode | string;
  recurrenceWeekdays?: unknown;
  recurrenceDayOfWeek?: unknown;
  recurrenceDayOfMonth?: unknown;
}

export function normalizeRoutineRecurrence(routine: RoutineLike): RecurrenceNormalized {
  const isValidMode = (m: string | undefined): m is RecurrenceMode =>
    m === 'specific_weekdays' || m === 'weekly_day' || m === 'monthly_day';

  const mode: RecurrenceMode = isValidMode(routine.recurrenceMode)
    ? routine.recurrenceMode
    : RECURRENCE_MODES.SPECIFIC_WEEKDAYS;

  const weekdays = normalizeWeekdays(routine.recurrenceWeekdays);
  const dayOfWeek = toInt(routine.recurrenceDayOfWeek);
  const dayOfMonth = toInt(routine.recurrenceDayOfMonth);

  if (mode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS) {
    return {
      mode,
      weekdays: weekdays.length ? weekdays : [...ALL_WEEKDAYS],
      dayOfWeek: null,
      dayOfMonth: null,
    };
  }

  if (mode === RECURRENCE_MODES.WEEKLY_DAY) {
    return {
      mode,
      weekdays: [],
      dayOfWeek: dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : 0,
      dayOfMonth: null,
    };
  }

  return {
    mode: RECURRENCE_MODES.MONTHLY_DAY,
    weekdays: [],
    dayOfWeek: null,
    dayOfMonth: dayOfMonth !== null && dayOfMonth >= 1 && dayOfMonth <= 31 ? dayOfMonth : 1,
  };
}

export function getIsoWeekdayMondayFirst(isoDate: string): number | null {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getDay() + 6) % 7;
}

export function getIsoDayOfMonth(isoDate: string): number | null {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.getDate();
}

export function isRoutineScheduledOnDate(routine: RoutineLike, isoDate: string): boolean {
  const normalized = normalizeRoutineRecurrence(routine);
  const weekday = getIsoWeekdayMondayFirst(isoDate);
  const dayOfMonth = getIsoDayOfMonth(isoDate);

  if (weekday === null || dayOfMonth === null) return false;

  switch (normalized.mode) {
    case RECURRENCE_MODES.SPECIFIC_WEEKDAYS:
      return normalized.weekdays.includes(weekday);

    case RECURRENCE_MODES.WEEKLY_DAY:
      return normalized.dayOfWeek === weekday;

    case RECURRENCE_MODES.MONTHLY_DAY:
      return normalized.dayOfMonth === dayOfMonth;
  }
}

export function getRoutineRecurrenceSummary(
  routine: RoutineLike,
  weekdayLabels: string[],
): RoutineRecurrenceSummary {
  const normalized = normalizeRoutineRecurrence(routine);
  const name = (day: number): string => weekdayLabels[day] ?? String(day);

  if (normalized.mode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS) {
    return {
      mode: normalized.mode,
      text: normalized.weekdays.map(name).join('، '),
    };
  }

  if (normalized.mode === RECURRENCE_MODES.WEEKLY_DAY) {
    return {
      mode: normalized.mode,
      text: normalized.dayOfWeek !== null ? name(normalized.dayOfWeek) : '',
    };
  }

  return {
    mode: normalized.mode,
    text: String(normalized.dayOfMonth ?? 1),
  };
}

export function calculateRoutineStreak(
  logDates: string[],
  isoDate: string,
): { current: number; max: number } {
  if (logDates.length === 0) return { current: 0, max: 0 };

  const sorted = [...logDates].sort();
  let current = 0;
  let max = 0;
  let streak = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    }
    if (streak > max) max = streak;
  }

  const today = new Date(isoDate);
  const lastDate = new Date(sorted[sorted.length - 1]);
  const daysDiff = Math.round(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  current = daysDiff <= 1 ? streak : 0;

  return { current, max };
}
