import type { CalendarType, DateParts } from '../types';

const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getCachedFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let fmt = dateTimeFormatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatterCache.set(key, fmt);
  }
  return fmt;
}

export function getTodayISO(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getCurrentMonthISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function isoDateToTimestamp(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00`).getTime();
}

export function timestampToIsoDate(ts: number): string {
  const d = new Date(ts);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function shiftISODate(isoDate: string, dayOffset: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getWeekStartISO(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  // Week starts on Saturday (Iran standard)
  const offset = (date.getDay() + 1) % 7;
  return shiftISODate(isoDate, -offset);
}

export function getWeekDays(weekStartISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftISODate(weekStartISO, i));
}

export function getMonthDaysGregorian(monthISO: string): string[] {
  const [year, month] = monthISO.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

export function getGregorianDatesForCalendarMonth(monthISO: string): string[] {
  const [year, month] = monthISO.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startOffset = (firstDay.getDay() + 1) % 7; // Saturday-based
  const endOffset = (6 - (lastDay.getDay() + 1) % 7) % 7;

  const startDate = shiftISODate(
    `${year}-${String(month).padStart(2, '0')}-01`,
    -startOffset,
  );
  const totalDays = daysInMonth(year, month) + startOffset + endOffset;

  return Array.from({ length: totalDays }, (_, i) => shiftISODate(startDate, i));
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function shiftMonthCursor(monthISO: string, direction: number): string {
  const [year, month] = monthISO.split('-').map(Number);
  const date = new Date(year, month - 1 + direction, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthCursorFromISO(isoDate: string): string {
  return isoDate.substring(0, 7);
}

interface CalendarIntlConfig {
  locale: string;
  calendar: string;
}

function getIntlConfig(language: string, calendarType: CalendarType): CalendarIntlConfig {
  return {
    locale: language === 'en' ? 'en-US' : 'fa-IR',
    calendar: calendarType === 'gregorian' ? 'gregory' : 'persian',
  };
}

export function formatDateParts(
  isoDate: string,
  language = 'fa',
  calendarType: CalendarType = 'jalali',
): DateParts {
  const { locale, calendar } = getIntlConfig(language, calendarType);
  const date = new Date(`${isoDate}T12:00:00`);

  const dayFormatter = getCachedFormatter(locale, {
    calendar,
    numberingSystem: 'latn',
    day: 'numeric',
  });

  const dayNameFormatter = getCachedFormatter(locale, {
    calendar,
    weekday: 'long',
  });

  const monthFormatter = getCachedFormatter(locale, {
    calendar,
    numberingSystem: 'latn',
    month: 'long',
  });

  const yearFormatter = getCachedFormatter(locale, {
    calendar,
    numberingSystem: 'latn',
    year: 'numeric',
  });

  const fullFormatter = getCachedFormatter(locale, {
    calendar,
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    day: dayFormatter.format(date),
    dayName: dayNameFormatter.format(date),
    month: monthFormatter.format(date),
    year: yearFormatter.format(date),
    fullDate: fullFormatter.format(date),
  };
}

export function formatMonthYear(
  monthISO: string,
  language = 'fa',
  calendarType: CalendarType = 'jalali',
): string {
  const { locale, calendar } = getIntlConfig(language, calendarType);
  const [year, month] = monthISO.split('-').map(Number);
  const date = new Date(year, month - 1, 15);

  const formatter = getCachedFormatter(locale, {
    calendar,
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'long',
  });

  return formatter.format(date);
}

export function formatDayNumber(
  isoDate: string,
  language = 'fa',
  calendarType: CalendarType = 'jalali',
): string {
  const { locale, calendar } = getIntlConfig(language, calendarType);
  const date = new Date(`${isoDate}T12:00:00`);

  const formatter = getCachedFormatter(locale, {
    calendar,
    numberingSystem: 'latn',
    day: 'numeric',
  });

  return formatter.format(date);
}

export function isToday(isoDate: string): boolean {
  return isoDate === getTodayISO();
}

export function isBeforeToday(isoDate: string): boolean {
  return isoDate < getTodayISO();
}

export function isAfterToday(isoDate: string): boolean {
  return isoDate > getTodayISO();
}

export function normalizeCalendarType(value: unknown): CalendarType {
  return value === 'gregorian' ? 'gregorian' : 'jalali';
}

export function getCountdownParts(
  eventDate: number,
  eventTime: string,
): { days: number; hours: number; minutes: number; seconds: number; isExpired: boolean } {
  const now = Date.now();
  const [hours, minutes] = eventTime.split(':').map(Number);
  const target = eventDate + hours * 3600_000 + minutes * 60_000;
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isExpired: false,
  };
}
