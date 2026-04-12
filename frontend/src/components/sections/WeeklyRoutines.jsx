import Card from "../ui/Card";
import Button from "../ui/Button";
import { formatPersianDateParts, formatPersianMonthYear } from "../../lib/date";

function StatGrid({ data, action }) {
  if (!data) return <p className="muted">در حال بارگذاری...</p>;

  return (
    <div className="stats-grid">
      <div>روتین‌ها: {data.routines}</div>
      <div>انجام‌شده: {data.done}</div>
      <div>انجام‌نشده: {data.missed}</div>
      <div>ثبت‌نشده: {data.remaining}</div>
      {action ? action : null}
    </div>
  );
}

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
  weeklyReport,
  onOpenWeeklyChart,
}) {
  return (
    <Card
      title="روتین های هفتگی"
      subtitle="وضعیت هر روتین روی روزهای هفته"
      actions={
        <button
          className="add-routine-icon-btn"
          onClick={openAddModal}
          title="افزودن روتین"
          aria-label="افزودن روتین"
        >
          +
        </button>
      }
    >
      {error ? <p className="error-text">{error}</p> : null}
      <div className="week-nav">
        <button className="btn btn-secondary" onClick={goToPreviousWeek}>
          هفته قبل
        </button>
        <p className="muted week-range-label">
          از {formatPersianDateParts(weekDays[0]).day}{" "}
          {formatPersianMonthYear(weekDays[0])}
          {" تا "}
          {formatPersianDateParts(weekDays[6]).day}{" "}
          {formatPersianMonthYear(weekDays[6])}
        </p>
        <button
          className="btn btn-secondary"
          onClick={goToNextWeek}
          disabled={!canGoNextWeek}
        >
          هفته بعد
        </button>
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
                        ✎
                      </button>
                      <button
                        className="routine-icon-btn delete"
                        title="حذف"
                        onClick={() => onRequestRoutineDelete(routine)}
                      >
                        🗑
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
                    const status = logsMap.get(key);
                    const isFutureDay = day > todayISO;
                    const cls =
                      status === "done"
                        ? "status-btn done"
                        : status === "missed"
                          ? "status-btn missed"
                          : "status-btn";

                    return (
                      <td key={key}>
                        <button
                          className={`${cls} ${isFutureDay ? "disabled" : ""}`.trim()}
                          disabled={isFutureDay}
                          title={
                            isFutureDay
                              ? "ثبت وضعیت برای تاریخ آینده مجاز نیست"
                              : ""
                          }
                          onClick={() => toggleStatus(routine.id, day)}
                        >
                          {status === "done"
                            ? "✓"
                            : status === "missed"
                              ? "✕"
                              : "-"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StatGrid
        data={weeklyReport}
        action={
          <Button variant="secondary" onClick={onOpenWeeklyChart}>
            چارت گزارش هفتگی
          </Button>
        }
      />
    </Card>
  );
}
