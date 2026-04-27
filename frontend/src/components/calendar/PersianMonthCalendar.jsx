import { useMemo } from "react";
import {
  formatPersianDateParts,
  formatPersianMonthYear,
  getGregorianDatesForPersianMonth,
  getMonthGridGregorian,
  getTodayISO,
} from "../../lib/date";
import { t } from "../../lib/i18n";
import "./PersianMonthCalendar.css";

export default function PersianMonthCalendar({
  month,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDay,
  selectedDate,
  getDayStatus,
  getDayBadge,
  language = "fa",
  className = "",
}) {
  const weekdays = t("calendar.weekdays", language);
  const monthDays = useMemo(
    () => getGregorianDatesForPersianMonth(month),
    [month],
  );
  const monthGrid = useMemo(
    () => getMonthGridGregorian(monthDays),
    [monthDays],
  );
  const monthLabel = formatPersianMonthYear(
    monthDays[0] || getTodayISO(),
    language,
  );

  return (
    <div className={`monthly-calendar-shell ${className}`.trim()}>
      <div className="monthly-calendar-header">
        <div className="monthly-calendar-navigation">
          <button className="btn btn-secondary" onClick={onPrevMonth}>
            {t("calendar.previousMonth", language)}
          </button>
          {onGoToday ? (
            <button className="btn btn-secondary" onClick={onGoToday}>
              {t("calendar.goToToday", language)}
            </button>
          ) : null}
          <button className="btn btn-secondary" onClick={onNextMonth}>
            {t("calendar.nextMonth", language)}
          </button>
        </div>
        <p className="monthly-calendar-title">{monthLabel}</p>
      </div>

      <div className="monthly-weekdays">
        {weekdays.map((label) => (
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

          const dayParts = formatPersianDateParts(cell.isoDate, language);
          const status = getDayStatus ? getDayStatus(cell.isoDate) : null;
          const badge = getDayBadge ? getDayBadge(cell.isoDate) : null;
          const cellClass = [
            "monthly-day",
            status === "done" ? "task-day-done" : "",
            status === "missed" ? "task-day-missed" : "",
            badge ? `task-day-badge-${badge}` : "",
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
