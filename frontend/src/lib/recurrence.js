export const RECURRENCE_MODES = {
  SPECIFIC_WEEKDAYS: "specific_weekdays",
  WEEKLY_DAY: "weekly_day",
  MONTHLY_DAY: "monthly_day",
};

export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function toInt(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function normalizeWeekdays(weekdays) {
  if (!Array.isArray(weekdays)) return [];
  return [
    ...new Set(weekdays.map(toInt).filter((day) => day >= 0 && day <= 6)),
  ].sort((a, b) => a - b);
}

export function normalizeRoutineRecurrence(routine = {}) {
  const mode = Object.values(RECURRENCE_MODES).includes(routine.recurrence_mode)
    ? routine.recurrence_mode
    : RECURRENCE_MODES.SPECIFIC_WEEKDAYS;

  const weekdays = normalizeWeekdays(routine.recurrence_weekdays);
  const dayOfWeek = toInt(routine.recurrence_day_of_week);
  const dayOfMonth = toInt(routine.recurrence_day_of_month);

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
      dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : 0,
      dayOfMonth: null,
    };
  }

  return {
    mode: RECURRENCE_MODES.MONTHLY_DAY,
    weekdays: [],
    dayOfWeek: null,
    dayOfMonth: dayOfMonth >= 1 && dayOfMonth <= 31 ? dayOfMonth : 1,
  };
}

export function getIsoWeekdayMondayFirst(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const jsDay = date.getDay();
  return (jsDay + 6) % 7;
}

export function getIsoDayOfMonth(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.getDate();
}

export function isRoutineScheduledOnDate(routine, isoDate) {
  const normalized = normalizeRoutineRecurrence(routine);
  const weekday = getIsoWeekdayMondayFirst(isoDate);
  const dayOfMonth = getIsoDayOfMonth(isoDate);

  if (weekday === null || dayOfMonth === null) return false;

  if (normalized.mode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS) {
    return normalized.weekdays.includes(weekday);
  }

  if (normalized.mode === RECURRENCE_MODES.WEEKLY_DAY) {
    return normalized.dayOfWeek === weekday;
  }

  return normalized.dayOfMonth === dayOfMonth;
}

export function getRoutineRecurrenceSummary(routine, weekdayLabels = []) {
  const normalized = normalizeRoutineRecurrence(routine);
  const name = (day) => weekdayLabels[day] || String(day);

  if (normalized.mode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS) {
    return {
      mode: normalized.mode,
      text: normalized.weekdays.map(name).join("، "),
    };
  }

  if (normalized.mode === RECURRENCE_MODES.WEEKLY_DAY) {
    return {
      mode: normalized.mode,
      text: name(normalized.dayOfWeek),
    };
  }

  return {
    mode: normalized.mode,
    text: String(normalized.dayOfMonth),
  };
}
