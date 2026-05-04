import { memo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import ProgressRing from "../ui/ProgressRing";
import { formatDateParts, formatMonthYear } from "../../lib/date";
import { getRoutineRecurrenceSummary } from "../../lib/recurrence";
import { t } from "../../lib/i18n";
import "./WeeklyRoutines.css";

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
    const cls =
      status === "done"
        ? "status-btn done"
        : status === "missed"
          ? "status-btn missed"
          : "status-btn";

    return (
      <button
        className={`${cls} ${mobile ? "status-btn-mobile" : ""} ${isDisabled ? "disabled" : ""}`.trim()}
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
        {error ? <p className="error-text">{error}</p> : null}
        <p className="empty-state-message">
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
      {error ? <p className="error-text">{error}</p> : null}
      <div className="week-nav">
        <div className="week-nav-buttons">
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
        <p className="muted week-range-label">
          {formatDateParts(weekDays[0], language, calendarType).day}{" "}
          {formatMonthYear(weekDays[0], language, calendarType)}
          <i
            className="fa-solid fa-arrows-left-right-to-line app-inline-icon week-range-icon"
            aria-hidden="true"
          />
          {formatDateParts(weekDays[6], language, calendarType).day}{" "}
          {formatMonthYear(weekDays[6], language, calendarType)}
        </p>
      </div>

      <div className="calendar-wrap">
        <table className="calendar-table week-table">
          <thead>
            <tr>
              <th>{t("weekly.routine", language)}</th>
              {weekDays.map((date) => {
                const p = formatDateParts(date, language, calendarType);
                return (
                  <th key={date} title={p.weekdayLong}>
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
                recurrenceWeekdayOptions.map((option) => option.label),
              );

              return (
                <tr key={routine.id}>
                  <td className="routine-title-cell routine-title-cell-justify">
                    <div className="routine-title-wrap">
                      <ProgressRing
                        className="routine-week-progress"
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
                        className="delete"
                        onClick={() => onRequestRoutineDelete(routine)}
                      />
                      <span
                        className="routine-item-icon"
                        style={{ color: routine.color || "inherit" }}
                      >
                        <i
                          className={routine.icon || "fa-solid fa-star"}
                          aria-hidden="true"
                        />
                      </span>
                      <span>{routine.title}</span>
                      <span className="routine-recurrence-chip">
                        {t("weekly.recurrenceSummaryPrefix", language)}{" "}
                        {recurrenceSummary.text}
                      </span>
                      {routine.alarm_enabled && routine.alarm_time ? (
                        <span
                          className="routine-alarm-chip"
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
                      <td key={key}>{renderStatusButton(routine, day)}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="weekly-mobile-list">
        {routines.map((routine) => {
          const progress = getRoutineWeekProgress(routine);
          const recurrenceSummary = getRoutineRecurrenceSummary(
            routine,
            recurrenceWeekdayOptions.map((option) => option.label),
          );

          return (
            <div key={`mobile-${routine.id}`} className="weekly-mobile-row">
              <div className="week-mobile-header">
                <div className="routine-title-wrap">
                  <ProgressRing
                    className="routine-week-progress"
                    percent={progress.percent}
                    size={24}
                    innerSize={18}
                    title={t("weekly.progressLabel", language, {
                      done: progress.doneCount,
                      total: progress.totalDays,
                    })}
                  />
                  <span
                    className="routine-item-icon"
                    style={{ color: routine.color || "inherit" }}
                  >
                    <i
                      className={routine.icon || "fa-solid fa-star"}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="routine-title-cell">{routine.title}</span>
                  {routine.alarm_enabled && routine.alarm_time ? (
                    <span
                      className="routine-alarm-chip"
                      title={t("common.alarmTime", language)}
                    >
                      <i className="fa-regular fa-clock" aria-hidden="true" />
                      {routine.alarm_time}
                    </span>
                  ) : null}
                </div>
                <div className="row-actions">
                  <IconButton
                    icon="fa-solid fa-pen"
                    label={t("weekly.edit", language)}
                    onClick={() => openEditModal(routine)}
                  />
                  <IconButton
                    icon="fa-solid fa-trash"
                    label={t("weekly.delete", language)}
                    className="delete"
                    onClick={() => onRequestRoutineDelete(routine)}
                  />
                </div>
              </div>

              <span className="routine-recurrence-chip week-mobile-recurrence">
                {t("weekly.recurrenceSummaryPrefix", language)}{" "}
                {recurrenceSummary.text}
              </span>

              <div className="weekly-mobile-weekdays">
                {weekDays.map((date) => {
                  const p = formatDateParts(date, language, calendarType);
                  return (
                    <span key={`weekday-${routine.id}-${date}`}>
                      {p.weekdayShort}
                    </span>
                  );
                })}
              </div>

              <div className="week-mobile-status-row">
                {weekDays.map((day) => (
                  <div
                    key={`mobile-status-${routine.id}-${day}`}
                    className="week-mobile-status-cell"
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
