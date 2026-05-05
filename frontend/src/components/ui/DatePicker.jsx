import { useMemo, useState } from "react";
import {
  formatDateParts,
  formatMonthYear,
  getGregorianDatesForCalendarMonth,
  getMonthGridGregorian,
  getTodayISO,
} from "../../lib/date";
import { t } from "../../lib/i18n";

export default function DatePicker({
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
  getDayIcon,
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
      const cursor = { year: month?.year, month: monthNumber, calendarType };
      const days = getGregorianDatesForCalendarMonth(cursor);
      const label = formatDateParts(
        days[0] || getTodayISO(),
        language,
        calendarType,
      ).month;
      return { value: monthNumber, label };
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

  const btnBase =
    "border-0 rounded-[var(--radius-sm)] px-3.5 py-2.5 cursor-pointer font-semibold bg-[var(--color-primary-soft)] text-[var(--color-secondary)] border border-[var(--color-border-strong)]";

  return (
    <div
      className={`mt-3 border border-[var(--color-border-default)] rounded-[14px] bg-[var(--color-bg-surface-soft)] p-2.5 ${className}`.trim()}
    >
      {/* Header */}
      <div className="flex items-center justify-start gap-2 max-[720px]:flex-col">
        <div className="flex gap-1.5 max-[720px]:w-full max-[720px]:justify-between">
          {showMonthSwitchButtons ? (
            <button type="button" className={btnBase} onClick={onPrevMonth}>
              {t("calendar.previousMonth", language)}
            </button>
          ) : null}
          {onGoToday ? (
            <button type="button" className={btnBase} onClick={onGoToday}>
              {t("calendar.goToToday", language)}
            </button>
          ) : null}
          {showMonthSwitchButtons ? (
            <button type="button" className={btnBase} onClick={onNextMonth}>
              {t("calendar.nextMonth", language)}
            </button>
          ) : null}
        </div>

        <div className="flex-1 grid justify-items-center relative">
          <button
            type="button"
            className="border-0 bg-transparent text-[var(--color-text-primary)] font-bold inline-flex items-center gap-2 cursor-pointer"
            onClick={() => setIsMonthYearPickerOpen((prev) => !prev)}
          >
            {monthLabel}
            <i className="fa-solid fa-caret-down" aria-hidden="true" />
          </button>

          {isMonthYearPickerOpen ? (
            <div
              className="mt-2 grid grid-cols-2 gap-2 w-full max-w-[340px] max-[720px]:w-full"
              role="group"
            >
              <select
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)] min-w-0"
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
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)] min-w-0"
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

      {/* Weekdays */}
      <div className="mt-2.5 grid grid-cols-7 gap-1.5 max-[720px]:gap-1">
        {weekdays.map((label) => (
          <span
            key={label}
            className="text-center text-[var(--color-text-secondary)] text-[0.84rem] font-bold max-[720px]:text-[0.75rem]"
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-1.5 grid grid-cols-7 gap-1.5 max-[720px]:gap-1">
        {monthGrid.map((cell, index) => {
          if (cell.isPlaceholder) {
            return (
              <div
                key={`placeholder-${index}`}
                className="min-h-[40px] max-[720px]:min-h-[34px] max-[720px]:rounded-[8px] bg-transparent border border-dashed cursor-default"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-bg-surface) 65%, var(--color-bg-page))",
                }}
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
          const iconData = getDayIcon ? getDayIcon(cell.isoDate) : null;
          const iconClass = iconData?.icon || iconData?.className || null;
          const iconColor = iconData?.color || null;
          const isSelected = selectedDate === cell.isoDate;
          const isHoliday = status === "holiday";
          const isDone = status === "done";
          const isMissed = status === "missed";
          const hasBadge = badge === "has-events" || badge === "has-entries";
          const isEntryBadge = badge === "has-entries";

          return (
            <button
              type="button"
              key={cell.isoDate}
              className={[
                "relative min-h-[40px] border rounded-[var(--radius-sm)] font-semibold cursor-pointer",
                "max-[720px]:min-h-[34px] max-[720px]:rounded-[8px]",
                isHoliday
                  ? "border-[var(--color-danger-border)] text-[var(--color-danger)]"
                  : isDone
                    ? "bg-[var(--color-success-soft)] border-[var(--color-success-border)]"
                    : isMissed
                      ? "border-[var(--color-danger-border)]"
                      : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]",
                isSelected
                  ? "border-[var(--color-accent-border)] [box-shadow:inset_0_0_0_1px_var(--color-primary)]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                isHoliday
                  ? {
                      background:
                        "color-mix(in srgb, var(--color-danger-soft) 78%, var(--color-bg-surface))",
                    }
                  : isMissed
                    ? {
                        background:
                          "color-mix(in srgb, var(--color-danger-soft) 70%, var(--color-bg-surface))",
                      }
                    : {}
              }
              onClick={() => onSelectDay?.(cell.isoDate)}
            >
              <span>{dayParts.day}</span>
              {iconClass ? (
                <i
                  className={`absolute top-1.5 [inset-inline-end:6px] text-[0.78rem] text-[var(--color-primary)] ${iconClass}`}
                  style={iconColor ? { color: iconColor } : undefined}
                  aria-hidden="true"
                />
              ) : null}
              {hasBadge ? (
                <span
                  className="absolute top-1.5 [inset-inline-start:6px] w-2 h-2 rounded-full border border-[var(--color-bg-surface)]"
                  style={{
                    backgroundColor: isEntryBadge
                      ? "var(--color-primary)"
                      : "var(--color-accent)",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
