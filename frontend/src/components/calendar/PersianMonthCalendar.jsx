import { useMemo } from "react";
import {
  formatPersianDateParts,
  formatPersianMonthYear,
  getGregorianDatesForPersianMonth,
  getMonthGridGregorian,
  getTodayISO,
} from "../../lib/date";

const WEEKDAY_LABELS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

export default function PersianMonthCalendar({
  month,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDay,
  selectedDate,
  getDayStatus,
  className = "",
}) {
  const monthDays = useMemo(
    () => getGregorianDatesForPersianMonth(month),
    [month],
  );
  const monthGrid = useMemo(
    () => getMonthGridGregorian(monthDays),
    [monthDays],
  );
  const monthLabel = formatPersianMonthYear(monthDays[0] || getTodayISO());

  return (
    <div className={`monthly-calendar-shell ${className}`.trim()}>
      <div className="monthly-calendar-header">
        <button className="btn btn-secondary" onClick={onPrevMonth}>
          ماه قبل
        </button>
        {onGoToday ? (
          <button className="btn btn-secondary" onClick={onGoToday}>
            برو به امروز
          </button>
        ) : null}
        <button className="btn btn-secondary" onClick={onNextMonth}>
          ماه بعد
        </button>
        <p className="monthly-calendar-title">{monthLabel}</p>
      </div>

      <div className="monthly-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="monthly-grid">
        {monthGrid.map((cell, index) => {
          if (cell.isPlaceholder) {
            return (
              <div
                key={`placeholder-${index}`}
                className="monthly-day placeholder"
              />
            );
          }

          const dayParts = formatPersianDateParts(cell.isoDate);
          const status = getDayStatus ? getDayStatus(cell.isoDate) : null;
          const cellClass = [
            "monthly-day",
            status === "done" ? "task-day-done" : "",
            status === "missed" ? "task-day-missed" : "",
            selectedDate === cell.isoDate ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={cell.isoDate}
              className={cellClass}
              onClick={() => onSelectDay?.(cell.isoDate)}
            >
              <span>{dayParts.day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
