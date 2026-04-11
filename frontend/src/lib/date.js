export function getCurrentMonthISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function getMonthDaysGregorian(monthISO) {
  const [year, month] = monthISO.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

export function formatPersianDateParts(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "numeric",
  }).format(date);
  const weekdayShort = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "short",
  }).format(date);
  const weekdayLong = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
  }).format(date);
  const month = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
  }).format(date);
  const year = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
  }).format(date);
  return { day, weekdayShort, weekdayLong, month, year };
}

export function formatPersianMonthYear(isoDate) {
  const p = formatPersianDateParts(isoDate);
  return `${p.month} ${p.year}`;
}
