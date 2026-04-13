import Card from "../ui/Card";
import { formatPersianDateParts, formatPersianMonthYear } from "../../lib/date";

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

  return (
    <Card
      title="روتین‌های من"
      subtitle="وضعیت هر روتین روی روزهای هفته"
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
            className="fa-solid fa-arrows-left-right-to-line app-inline-icon"
            style={{ margin: "0 8px" }}
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
            {!routines.length ? (
              <tr>
                <td colSpan={weekDays.length + 1}>روتینی یافت نشد.</td>
              </tr>
            ) : (
              routines.map((routine) => (
                <tr key={routine.id}>
                  <td
                    className="routine-title-cell"
                    style={{ textAlign: "justify" }}
                  >
                    <div className="routine-title-wrap">
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
                      <span
                        className="routine-color-dot"
                        style={{
                          backgroundColor: routine.color || "#9fb6ff",
                        }}
                      />
                      <span>{routine.title}</span>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const key = `${routine.id}-${day}`;

                    return (
                      <td key={key}>{renderStatusButton(routine.id, day)}</td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="weekly-mobile-list">
        {!routines.length ? (
          <p className="muted">روتینی یافت نشد.</p>
        ) : (
          routines.map((routine) => (
            <div key={`mobile-${routine.id}`} className="weekly-mobile-row">
              <div className="week-mobile-header">
                <div className="routine-title-wrap">
                  <span
                    className="routine-color-dot"
                    style={{
                      backgroundColor: routine.color || "#9fb6ff",
                    }}
                  />
                  <span className="routine-title-cell">{routine.title}</span>
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
                  return <span key={`weekday-${routine.id}-${date}`}>{p.weekdayShort}</span>;
                })}
              </div>

              <div className="week-mobile-status-row">
                {weekDays.map((day) => (
                  <div key={`mobile-status-${routine.id}-${day}`} className="week-mobile-status-cell">
                    {renderStatusButton(routine.id, day, true)}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
