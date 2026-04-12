export function getCurrentMonthISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function getTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getMonthDaysGregorian(monthISO) {
  const [year, month] = monthISO.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

export function shiftISODate(isoDate, dayOffset) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getWeekStartISO(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  const saturdayBasedOffset = (date.getDay() + 1) % 7;
  return shiftISODate(isoDate, -saturdayBasedOffset);
}

export function getWeekDaysGregorian(weekStartISO) {
  return Array.from({ length: 7 }, (_, idx) => shiftISODate(weekStartISO, idx));
}

export function formatPersianDateParts(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);

  const optionsBase = {
    calendar: "persian",
    numberingSystem: "latn",
  };

  const day = new Intl.DateTimeFormat("fa-IR", {
    ...optionsBase,
    day: "numeric",
  }).format(date);

  const weekdayShort = new Intl.DateTimeFormat("fa-IR", {
    ...optionsBase,
    weekday: "short",
  }).format(date);

  const weekdayLong = new Intl.DateTimeFormat("fa-IR", {
    ...optionsBase,
    weekday: "long",
  }).format(date);

  const month = new Intl.DateTimeFormat("fa-IR", {
    ...optionsBase,
    month: "long",
  }).format(date);

  const year = new Intl.DateTimeFormat("fa-IR", {
    ...optionsBase,
    year: "numeric",
  }).format(date);

  return { day, weekdayShort, weekdayLong, month, year };
}

export function formatPersianMonthYear(isoDate) {
  const p = formatPersianDateParts(isoDate);
  return `${p.month} ${p.year}`;
}

export function getPersianDatePartsNumeric(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function getPersianMonthFromISO(isoDate) {
  const parts = getPersianDatePartsNumeric(isoDate);
  if (!parts) {
    const today = getTodayISO();
    const fallback = getPersianDatePartsNumeric(today);
    return { year: fallback.year, month: fallback.month };
  }
  return { year: parts.year, month: parts.month };
}

export function shiftPersianMonth(persianMonth, monthOffset) {
  let { year, month } = persianMonth;
  month += monthOffset;

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return { year, month };
}

export function getGregorianDatesForPersianMonth({ year, month }) {
  const results = [];
  const start = new Date(Date.UTC(year + 620, 0, 1, 12));
  const end = new Date(Date.UTC(year + 623, 0, 1, 12));

  for (
    let date = new Date(start);
    date < end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const isoDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const p = getPersianDatePartsNumeric(isoDate);
    if (p && p.year === year && p.month === month) {
      results.push(isoDate);
    }
  }

  return results;
}

export function getMonthGridGregorian(monthDays) {
  if (!monthDays.length) return [];

  const firstDay = new Date(`${monthDays[0]}T00:00:00`);
  const daysInMonth = monthDays.length;
  const leadingDays = (firstDay.getDay() + 1) % 7;
  const cells = [];

  for (let index = leadingDays; index > 0; index -= 1) {
    cells.push({ isoDate: null, isPlaceholder: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      isoDate: monthDays[day - 1],
      isPlaceholder: false,
    });
  }

  const targetCount = cells.length <= 35 ? 35 : 42;
  while (cells.length < targetCount) {
    cells.push({ isoDate: null, isPlaceholder: true });
  }

  return cells;
}
