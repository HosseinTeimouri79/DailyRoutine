import { useMemo, useState } from "react";
import {
  formatDateParts,
  formatMonthYear,
  getGregorianDatesForCalendarMonth,
  getMonthGridGregorian,
  getTodayISO,
} from "../../lib/date";
import { t } from "../../lib/i18n";
import "./PersianMonthCalendar.css";

export default function PersianMonthCalendar({
  month,
  calendarType = "jalali",
  onPrevMonth,
  onNextMonth,
  onSetMonth,
  onGoToday,
  showMonthSwitchButtons = true,
  onSelectDay,
  selectedDate,
  getDayStatus,
  getDayBadge,
  language = "fa",
  className = "",
}) {
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
  const weekdays = t(
    calendarType === "gregorian"
      ? "calendar.weekdaysGregorian"
      : "calendar.weekdays",
    language,
  );
  const monthDays = useMemo(
    () => getGregorianDatesForCalendarMonth(month),
    [month],
  );
  const monthGrid = useMemo(
    () => getMonthGridGregorian(monthDays),
    [monthDays],
  );
  const monthLabel = formatMonthYear(
    monthDays[0] || getTodayISO(),
    language,
    calendarType,
  );

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const monthNumber = idx + 1;
      const cursor = {
        year: month?.year,
        month: monthNumber,
        calendarType,
      };
      const days = getGregorianDatesForCalendarMonth(cursor);
      const label = formatDateParts(
        days[0] || getTodayISO(),
        language,
        calendarType,
      ).month;
      return {
        value: monthNumber,
        label,
      };
    });
  }, [calendarType, language, month?.year]);

  const yearOptions = useMemo(() => {
    const baseYear = month?.year || Number(getTodayISO().split("-")[0]);
    return Array.from({ length: 121 }, (_, idx) => baseYear - 80 + idx);
  }, [month?.year]);

  function setMonthFromPicker(nextYear, nextMonth) {
    if (!onSetMonth) return;
    onSetMonth({
      year: Number(nextYear),
      month: Number(nextMonth),
      calendarType,
    });
  }

  return (
    <div className={`monthly-calendar-shell ${className}`.trim()}>
      <div className="monthly-calendar-header">
        <div className="monthly-calendar-navigation">
          {showMonthSwitchButtons ? (
            <button className="btn btn-secondary" onClick={onPrevMonth}>
              {t("calendar.previousMonth", language)}
            </button>
          ) : null}
          {onGoToday ? (
            <button className="btn btn-secondary" onClick={onGoToday}>
              {t("calendar.goToToday", language)}
            </button>
          ) : null}
          {showMonthSwitchButtons ? (
            <button className="btn btn-secondary" onClick={onNextMonth}>
              {t("calendar.nextMonth", language)}
            </button>
          ) : null}
        </div>
        <div className="monthly-calendar-title-wrap">
          <button
            type="button"
            className="monthly-calendar-title-btn"
            onClick={() => setIsMonthYearPickerOpen((prev) => !prev)}
          >
            {monthLabel}
            <i className="fa-solid fa-caret-down" aria-hidden="true" />
          </button>

          {isMonthYearPickerOpen ? (
            <div className="month-year-dropdown" role="group">
              <select
                className="input"
                value={month?.month || 1}
                onChange={(event) =>
                  setMonthFromPicker(month?.year, event.target.value)
                }
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="input"
                value={month?.year || yearOptions[0]}
                onChange={(event) =>
                  setMonthFromPicker(event.target.value, month?.month || 1)
                }
              >
                {yearOptions.map((yearValue) => (
                  <option key={yearValue} value={yearValue}>
                    {yearValue}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
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

          const dayParts = formatDateParts(
            cell.isoDate,
            language,
            calendarType,
          );
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
