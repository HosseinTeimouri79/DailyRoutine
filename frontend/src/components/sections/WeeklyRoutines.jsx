import { memo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import ProgressRing from "../ui/ProgressRing";
import { formatDateParts, formatMonthYear } from "../../lib/date";
import { getRoutineRecurrenceSummary } from "../../lib/recurrence";
import { t } from "../../lib/i18n";
// WeeklyRoutines styles moved to Tailwind utilities in component

function WeeklyRoutines({
  error,
  openAddModal,
  goToPreviousWeek,
  goToNextWeek,
  canGoNextWeek,
  weekDays,
  routines,
  logsMap,
  todayISO,
  openEditModal,
  onRequestRoutineDelete,
  toggleStatus,
  isRoutineScheduledOnDate,
  recurrenceWeekdayOptions,
  language,
  calendarType,
}) {
  const recurrenceWeekdayLabels = recurrenceWeekdayOptions.reduce(
    (labels, option) => {
      labels[option.value] = option.label;
      return labels;
    },
    [],
  );

  function getRoutineWeekProgress(routine) {
    const doneCount = weekDays.reduce((count, day) => {
      if (!isRoutineScheduledOnDate(routine, day)) return count;
      const status = logsMap.get(`${routine.id}-${day}`);
      return status === "done" ? count + 1 : count;
    }, 0);

    const totalDays =
      weekDays.filter((day) => isRoutineScheduledOnDate(routine, day)).length ||
      1;
    const percent = Math.round((doneCount / totalDays) * 100);

    return { doneCount, totalDays, percent };
  }

  function renderStatusButton(routine, day, mobile = false) {
    const key = `${routine.id}-${day}`;
    const status = logsMap.get(key);
    const isFutureDay = day > todayISO;
    const isScheduled = isRoutineScheduledOnDate(routine, day);
    const isDisabled = isFutureDay || !isScheduled;
    const statusClasses =
      status === "done"
        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
        : status === "missed"
          ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          : "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]";

    return (
      <button
        className={[
          "inline-flex items-center justify-center transition-colors font-semibold",
          mobile ? "w-full h-[34px]" : "min-w-[85px] h-[34px] px-2",
          statusClasses,
          isDisabled ? "opacity-45 cursor-not-allowed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={isDisabled}
        title={
          isFutureDay
            ? t("weekly.cannotSetFuture", language)
            : !isScheduled
              ? t("weekly.cannotSetUnscheduled", language)
              : ""
        }
        onClick={() => toggleStatus(routine.id, day)}
      >
        <i
          className={
            !isScheduled
              ? "fa-solid fa-ban"
              : status === "done"
                ? "fa-solid fa-check"
                : status === "missed"
                  ? "fa-solid fa-xmark"
                  : "fa-solid fa-minus"
          }
          aria-hidden="true"
        />
      </button>
    );
  }

  if (!routines.length) {
    return (
      <Card
        title={t("weekly.title", language)}
        subtitle={t("weekly.subtitle", language)}
        actions={
          <Button
            icon="fa-solid fa-plus"
            onClick={openAddModal}
            title={t("weekly.add", language)}
            aria-label={t("weekly.add", language)}
          >
            {t("weekly.add", language)}
          </Button>
        }
      >
        {error ? (
          <p className="text-[var(--color-danger)] text-[0.9rem]">{error}</p>
        ) : null}
        <p className="mt-3 border rounded-md p-3 text-center text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-soft)]">
          {t("weekly.noRoutines", language)}
        </p>
      </Card>
    );
  }

  return (
    <Card
      title={t("weekly.title", language)}
      subtitle={t("weekly.subtitle", language)}
      actions={
        <Button
          icon="fa-solid fa-plus"
          onClick={openAddModal}
          title={t("weekly.add", language)}
          aria-label={t("weekly.add", language)}
        >
          {t("weekly.add", language)}
        </Button>
      }
    >
      {error ? (
        <p className="text-[var(--color-danger)] text-[0.9rem]">{error}</p>
      ) : null}
      <div className="flex items-center justify-between gap-[10px] mt-2">
        <div className="flex gap-[6px]">
          <Button variant="secondary" onClick={goToPreviousWeek}>
            {t("weekly.previousWeek", language)}
          </Button>
          <Button
            variant="secondary"
            onClick={goToNextWeek}
            disabled={!canGoNextWeek}
          >
            {t("weekly.nextWeek", language)}
          </Button>
        </div>
        <p className="text-[var(--color-text-secondary)] m-0 text-center text-[0.92rem]">
          {formatDateParts(weekDays[0], language, calendarType).day}{" "}
          {formatMonthYear(weekDays[0], language, calendarType)}
          <i
            className="fa-solid fa-arrows-left-right-to-line inline-flex items-center justify-center mx-2"
            aria-hidden="true"
          />
          {formatDateParts(weekDays[6], language, calendarType).day}{" "}
          {formatMonthYear(weekDays[6], language, calendarType)}
        </p>
      </div>

      <div className="hidden md:block overflow-x-auto mt-3">
        <table className="table-auto border-collapse border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] w-full min-w-[900px] rounded-md overflow-hidden">
          <thead>
            <tr>
              <th className="min-w-[320px] whitespace-nowrap border border-[var(--color-border-default)]">
                {t("weekly.routine", language)}
              </th>
              {weekDays.map((date) => {
                const p = formatDateParts(date, language, calendarType);
                return (
                  <th
                    key={date}
                    title={p.weekdayLong}
                    className="min-w-[55px] whitespace-nowrap border border-[var(--color-border-default)]"
                  >
                    {p.weekdayShort}
                    <br />
                    {p.day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {routines.map((routine) => {
              const progress = getRoutineWeekProgress(routine);
              const recurrenceSummary = getRoutineRecurrenceSummary(
                routine,
                recurrenceWeekdayLabels,
              );

              return (
                <tr key={routine.id}>
                  <td className="min-w-[320px] whitespace-nowrap font-semibold text-[var(--color-text-primary)] text-justify border border-[var(--color-border-default)]">
                    <div className="inline-flex items-center gap-[6px]">
                      <ProgressRing
                        percent={progress.percent}
                        size={26}
                        innerSize={19}
                        title={t("weekly.progressLabel", language, {
                          done: progress.doneCount,
                          total: progress.totalDays,
                        })}
                      />
                      <IconButton
                        icon="fa-solid fa-pen"
                        label={t("weekly.edit", language)}
                        onClick={() => openEditModal(routine)}
                      />
                      <IconButton
                        icon="fa-solid fa-trash"
                        label={t("weekly.delete", language)}
                        className="bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] text-[var(--color-danger)]"
                        onClick={() => onRequestRoutineDelete(routine)}
                      />
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[color-mix(in_srgb,var(--color-bg-surface)_90%,transparent)] border"
                        style={{ color: routine.color || "inherit" }}
                      >
                        <i
                          className={routine.icon || "fa-solid fa-star"}
                          aria-hidden="true"
                        />
                      </span>
                      <span>{routine.title}</span>
                      <span className="inline-flex items-center text-[0.75rem] text-[var(--color-text-secondary)] bg-[color-mix(in_srgb,var(--color-bg-surface)_70%,transparent)] border rounded-full px-2 py-[2px]">
                        {t("weekly.recurrenceSummaryPrefix", language)}{" "}
                        {recurrenceSummary.text}
                      </span>
                      {routine.alarm_enabled && routine.alarm_time ? (
                        <span
                          className="inline-flex items-center gap-1 text-[0.78rem] text-[var(--color-text-secondary)]"
                          title={t("dailyTasks.markDone", language)}
                        >
                          <i
                            className="fa-regular fa-clock"
                            aria-hidden="true"
                          />
                          {routine.alarm_time}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const key = `${routine.id}-${day}`;
                    return (
                      <td
                        className="min-w-[85px] text-center whitespace-nowrap border border-[var(--color-border-default)]"
                        key={key}
                      >
                        {renderStatusButton(routine, day)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-[10px] md:hidden mt-3">
        {routines.map((routine) => {
          const progress = getRoutineWeekProgress(routine);
          const recurrenceSummary = getRoutineRecurrenceSummary(
            routine,
            recurrenceWeekdayLabels,
          );

          return (
            <div
              key={`mobile-${routine.id}`}
              className="border rounded-md p-2.5 bg-[var(--color-bg-surface-soft)] grid gap-[10px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-[6px]">
                  <ProgressRing
                    percent={progress.percent}
                    size={24}
                    innerSize={18}
                    title={t("weekly.progressLabel", language, {
                      done: progress.doneCount,
                      total: progress.totalDays,
                    })}
                  />
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[color-mix(in_srgb,var(--color-bg-surface)_90%,transparent)] border"
                    style={{ color: routine.color || "inherit" }}
                  >
                    <i
                      className={routine.icon || "fa-solid fa-star"}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="whitespace-nowrap font-semibold text-[var(--color-text-primary)]">
                    {routine.title}
                  </span>
                  {routine.alarm_enabled && routine.alarm_time ? (
                    <span
                      className="inline-flex items-center gap-1 text-[0.78rem] text-[var(--color-text-secondary)]"
                      title={t("common.alarmTime", language)}
                    >
                      <i className="fa-regular fa-clock" aria-hidden="true" />
                      {routine.alarm_time}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <IconButton
                    icon="fa-solid fa-pen"
                    label={t("weekly.edit", language)}
                    onClick={() => openEditModal(routine)}
                  />
                  <IconButton
                    icon="fa-solid fa-trash"
                    label={t("weekly.delete", language)}
                    className="bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] text-[var(--color-danger)]"
                    onClick={() => onRequestRoutineDelete(routine)}
                  />
                </div>
              </div>

              <span className="inline-flex items-center text-[0.75rem] text-[var(--color-text-secondary)] bg-[color-mix(in_srgb,var(--color-bg-surface)_70%,transparent)] border rounded-full px-2 py-[2px] justify-self-start">
                {t("weekly.recurrenceSummaryPrefix", language)}{" "}
                {recurrenceSummary.text}
              </span>

              <div className="grid grid-cols-7 gap-[6px]">
                {weekDays.map((date) => {
                  const p = formatDateParts(date, language, calendarType);
                  return (
                    <span key={`weekday-${routine.id}-${date}`}>
                      {p.weekdayShort}
                    </span>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 gap-[6px]">
                {weekDays.map((day) => (
                  <div
                    key={`mobile-status-${routine.id}-${day}`}
                    className="min-w-0"
                  >
                    {renderStatusButton(routine, day, true)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default memo(WeeklyRoutines);
