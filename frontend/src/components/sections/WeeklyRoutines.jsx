import Card from "../ui/Card";
import ProgressRing from "../ui/ProgressRing";
import { formatPersianDateParts, formatPersianMonthYear } from "../../lib/date";
import "./WeeklyRoutines.css";

export default function WeeklyRoutines({
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
}) {
  function getRoutineWeekProgress(routineId) {
    const doneCount = weekDays.reduce((count, day) => {
      const status = logsMap.get(`${routineId}-${day}`);
      return status === "done" ? count + 1 : count;
    }, 0);

    const totalDays = weekDays.length || 1;
    const percent = Math.round((doneCount / totalDays) * 100);

    return { doneCount, totalDays, percent };
  }

  function renderStatusButton(routineId, day, mobile = false) {
    const key = `${routineId}-${day}`;
    const status = logsMap.get(key);
    const isFutureDay = day > todayISO;
    const cls =
      status === "done"
        ? "status-btn done"
        : status === "missed"
          ? "status-btn missed"
          : "status-btn";

    return (
      <button
        className={`${cls} ${mobile ? "status-btn-mobile" : ""} ${isFutureDay ? "disabled" : ""}`.trim()}
        disabled={isFutureDay}
        title={isFutureDay ? "ثبت وضعیت برای تاریخ آینده مجاز نیست" : ""}
        onClick={() => toggleStatus(routineId, day)}
      >
        <i
          className={
            status === "done"
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
        title="روتین‌های من"
        subtitle="وضعیت هر روتین در روزهای هفته"
        actions={
          <button
            className="btn btn-primary"
            onClick={openAddModal}
            title="افزودن روتین"
            aria-label="افزودن روتین"
          >
            افزودن
          </button>
        }
      >
        {error ? <p className="error-text">{error}</p> : null}
        <p className="empty-state-message">روتینی یافت نشد.</p>
      </Card>
    );
  }

  return (
    <Card
      title="روتین‌های من"
      subtitle="وضعیت هر روتین در روزهای هفته"
      actions={
        <button
          className="btn btn-primary"
          onClick={openAddModal}
          title="افزودن روتین"
          aria-label="افزودن روتین"
        >
          افزودن
        </button>
      }
    >
      {error ? <p className="error-text">{error}</p> : null}
      <div className="week-nav">
        <div className="week-nav-buttons">
          <button className="btn btn-secondary" onClick={goToPreviousWeek}>
            هفته قبل
          </button>
          <button
            className="btn btn-secondary"
            onClick={goToNextWeek}
            disabled={!canGoNextWeek}
          >
            هفته بعد
          </button>
        </div>
        <p className="muted week-range-label">
          از {formatPersianDateParts(weekDays[0]).day}{" "}
          {formatPersianMonthYear(weekDays[0])}
          {/* {"تا "}  fa-arrows-left-right-to-line */}
          <i
            className="fa-solid fa-arrows-left-right-to-line app-inline-icon week-range-icon"
            aria-hidden="true"
          />
          {formatPersianDateParts(weekDays[6]).day}{" "}
          {formatPersianMonthYear(weekDays[6])}
        </p>
      </div>

      <div className="calendar-wrap">
        <table className="calendar-table week-table">
          <thead>
            <tr>
              <th>روتین</th>
              {weekDays.map((date) => {
                const p = formatPersianDateParts(date);
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
              const progress = getRoutineWeekProgress(routine.id);

              return (
                <tr key={routine.id}>
                  <td className="routine-title-cell routine-title-cell-justify">
                    <div className="routine-title-wrap">
                      <ProgressRing
                        className="routine-week-progress"
                        percent={progress.percent}
                        size={26}
                        innerSize={19}
                        title={`پیشرفت هفتگی: ${progress.doneCount} از ${progress.totalDays}`}
                      />
                      <button
                        className="routine-icon-btn"
                        title="ویرایش"
                        onClick={() => openEditModal(routine)}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                      </button>
                      <button
                        className="routine-icon-btn delete"
                        title="حذف"
                        onClick={() => onRequestRoutineDelete(routine)}
                      >
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                      </button>
                      <span>{routine.title}</span>
                      {routine.alarm_enabled && routine.alarm_time ? (
                        <span className="routine-alarm-chip" title="زمان هشدار">
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
                      <td key={key}>{renderStatusButton(routine.id, day)}</td>
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
          const progress = getRoutineWeekProgress(routine.id);

          return (
            <div key={`mobile-${routine.id}`} className="weekly-mobile-row">
              <div className="week-mobile-header">
                <div className="routine-title-wrap">
                  <ProgressRing
                    className="routine-week-progress"
                    percent={progress.percent}
                    size={24}
                    innerSize={18}
                    title={`پیشرفت هفتگی: ${progress.doneCount} از ${progress.totalDays}`}
                  />
                  <span className="routine-title-cell">{routine.title}</span>
                  {routine.alarm_enabled && routine.alarm_time ? (
                    <span className="routine-alarm-chip" title="زمان هشدار">
                      <i className="fa-regular fa-clock" aria-hidden="true" />
                      {routine.alarm_time}
                    </span>
                  ) : null}
                </div>
                <div className="row-actions">
                  <button
                    className="routine-icon-btn"
                    title="ویرایش"
                    onClick={() => openEditModal(routine)}
                  >
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    className="routine-icon-btn delete"
                    title="حذف"
                    onClick={() => onRequestRoutineDelete(routine)}
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="weekly-mobile-weekdays">
                {weekDays.map((date) => {
                  const p = formatPersianDateParts(date);
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
                    {renderStatusButton(routine.id, day, true)}
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
