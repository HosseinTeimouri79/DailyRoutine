import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { api } from "../lib/api";
import {
  formatPersianDateParts,
  formatPersianMonthYear,
  getTodayISO,
  getWeekDaysGregorian,
  getWeekStartISO,
  shiftISODate,
} from "../lib/date";

const WEEKDAY_LABELS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function StatGrid({ data }) {
  if (!data) return <p className="muted">در حال بارگذاری...</p>;

  return (
    <div className="stats-grid">
      <div>روتین‌ها: {data.routines}</div>
      <div>انجام‌شده: {data.done}</div>
      <div>انجام‌نشده: {data.missed}</div>
      <div>ثبت‌نشده: {data.remaining}</div>
    </div>
  );
}

function buildStatsForDays(days, routines, logsMap) {
  const total = days.length * routines.length;
  let done = 0;
  let missed = 0;

  routines.forEach((routine) => {
    days.forEach((day) => {
      const status = logsMap.get(`${routine.id}-${day}`);
      if (status === "done") done += 1;
      if (status === "missed") missed += 1;
    });
  });

  return {
    routines: routines.length,
    done,
    missed,
    remaining: Math.max(total - done - missed, 0),
  };
}

function getNextStatus(current) {
  if (current === "done") return "missed";
  if (current === "missed") return "done";
  return "done";
}

function getPersianDateParts(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) return null;
  return { year, month, day };
}

function shiftPersianMonth(persianMonth, monthOffset) {
  let { year, month } = persianMonth;
  month += monthOffset;

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return { year, month };
}

function getGregorianDatesForPersianMonth({ year, month }) {
  const results = [];
  const start = new Date(Date.UTC(year + 620, 0, 1, 12));
  const end = new Date(Date.UTC(year + 623, 0, 1, 12));

  for (
    let date = new Date(start);
    date < end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const isoDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const p = getPersianDateParts(isoDate);
    if (p && p.year === year && p.month === month) {
      results.push(isoDate);
    }
  }

  return results;
}

function getMonthGridGregorian(monthDays) {
  if (!monthDays.length) return [];

  const firstDay = new Date(`${monthDays[0]}T00:00:00`);
  const daysInMonth = monthDays.length;
  const leadingDays = (firstDay.getDay() + 1) % 7;

  const cells = [];

  for (let index = leadingDays; index > 0; index -= 1) {
    cells.push({ isoDate: null, inCurrentMonth: false, isPlaceholder: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      isoDate: monthDays[day - 1],
      inCurrentMonth: true,
      isPlaceholder: false,
    });
  }

  const targetCount = cells.length <= 35 ? 35 : 42;
  while (cells.length < targetCount) {
    cells.push({ isoDate: null, inCurrentMonth: false, isPlaceholder: true });
  }

  return cells;
}

export default function CalendarPage() {
  const [month, setMonth] = useState(() => {
    const today = getPersianDateParts(getTodayISO());
    return { year: today.year, month: today.month };
  });
  const [weekStart, setWeekStart] = useState(getWeekStartISO(getTodayISO()));
  const todayISO = useMemo(() => getTodayISO(), []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineColor, setNewRoutineColor] = useState("#375dfb");
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [logsMap, setLogsMap] = useState(new Map());
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const monthDays = useMemo(
    () => getGregorianDatesForPersianMonth(month),
    [month],
  );
  const monthGrid = useMemo(
    () => getMonthGridGregorian(monthDays),
    [monthDays],
  );
  const weekDays = useMemo(() => getWeekDaysGregorian(weekStart), [weekStart]);
  const todayWeekStart = useMemo(() => getWeekStartISO(getTodayISO()), []);
  const canGoNextWeek = weekStart < todayWeekStart;

  const requestStartDate = useMemo(() => {
    const monthStart = monthDays[0] || todayISO;
    return weekStart < monthStart ? weekStart : monthStart;
  }, [monthDays, weekStart, todayISO]);

  const requestEndDate = useMemo(() => {
    const monthEnd = monthDays[monthDays.length - 1] || todayISO;
    const weekEnd = weekDays[weekDays.length - 1];
    return weekEnd > monthEnd ? weekEnd : monthEnd;
  }, [monthDays, weekDays, todayISO]);

  const weeklyReport = useMemo(
    () => buildStatsForDays(weekDays, routines, logsMap),
    [weekDays, routines, logsMap],
  );

  const monthlyReport = useMemo(
    () => buildStatsForDays(monthDays, routines, logsMap),
    [monthDays, routines, logsMap],
  );

  function showSnackbar(message, type = "success") {
    setSnackbar({ open: true, type, message });
  }

  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, 2600);
    return () => clearTimeout(timer);
  }, [snackbar.open]);

  async function load() {
    try {
      setError("");
      const [routineData, logs] = await Promise.all([
        api.getRoutines(),
        api.getLogs(`?startDate=${requestStartDate}&endDate=${requestEndDate}`),
      ]);

      const nextMap = new Map();
      logs.forEach((item) => {
        nextMap.set(`${item.routine_id}-${item.date}`, item.status);
      });

      setRoutines(routineData);
      setSelectedRoutineId((prev) => {
        if (!routineData.length) return null;
        if (prev && routineData.some((routine) => routine.id === prev)) {
          return prev;
        }
        return routineData[0].id;
      });
      setLogsMap(nextMap);
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, "error");
    }
  }

  useEffect(() => {
    load();
  }, [month, requestStartDate, requestEndDate]);

  async function toggleStatus(routineId, date) {
    if (date > todayISO) {
      showSnackbar("ثبت وضعیت برای تاریخ آینده مجاز نیست.", "error");
      return;
    }

    try {
      const key = `${routineId}-${date}`;
      const next = getNextStatus(logsMap.get(key));
      await api.upsertLog({ routine_id: routineId, date, status: next });
      showSnackbar("وضعیت روتین با موفقیت ثبت شد.");
      await load();
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, "error");
    }
  }

  async function createRoutine(event) {
    event.preventDefault();
    if (!newRoutineTitle.trim()) return;
    try {
      if (editingRoutineId) {
        await api.updateRoutine(editingRoutineId, {
          title: newRoutineTitle.trim(),
          color: newRoutineColor,
        });
      } else {
        await api.createRoutine({
          title: newRoutineTitle.trim(),
          color: newRoutineColor,
        });
      }
      setNewRoutineTitle("");
      setNewRoutineColor("#375dfb");
      setEditingRoutineId(null);
      setIsAddModalOpen(false);
      showSnackbar(
        editingRoutineId
          ? "روتین با موفقیت ویرایش شد."
          : "روتین جدید با موفقیت ساخته شد.",
      );
      await load();
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, "error");
    }
  }

  async function removeRoutine(id) {
    try {
      await api.deleteRoutine(id);
      showSnackbar("روتین حذف شد.");
      await load();
    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, "error");
    }
  }

  function openAddModal() {
    setEditingRoutineId(null);
    setNewRoutineTitle("");
    setNewRoutineColor("#375dfb");
    setIsAddModalOpen(true);
  }

  function openEditModal(routine) {
    setEditingRoutineId(routine.id);
    setNewRoutineTitle(routine.title || "");
    setNewRoutineColor(routine.color || "#375dfb");
    setIsAddModalOpen(true);
  }

  function goToPreviousWeek() {
    setWeekStart((prev) => shiftISODate(prev, -7));
  }

  function goToNextWeek() {
    if (!canGoNextWeek) return;
    setWeekStart((prev) => shiftISODate(prev, 7));
  }

  function goToPreviousMonth() {
    setMonth((prev) => shiftPersianMonth(prev, -1));
  }

  function goToNextMonth() {
    setMonth((prev) => shiftPersianMonth(prev, 1));
  }

  function getSelectedRoutineDayStatus(isoDate) {
    if (!selectedRoutineId) return null;
    return logsMap.get(`${selectedRoutineId}-${isoDate}`) || null;
  }

  function handleDayClick(isoDate, inCurrentMonth) {
    if (!isoDate) return;
    if (!inCurrentMonth) {
      setMonth(isoDate.slice(0, 7));
    }
  }

  return (
    <AppShell title="روتین‌های من">
      <Card
        title="نمایش هفتگی روتین‌ها"
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
                    <td className="routine-title-cell">
                      <div className="routine-title-wrap">
                        <span
                          className="routine-color-dot"
                          style={{
                            backgroundColor: routine.color || "#9fb6ff",
                          }}
                        />
                        <span>{routine.title}</span>
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
                          onClick={() => setRoutineToDelete(routine)}
                        >
                          🗑
                        </button>
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

        <StatGrid data={weeklyReport} />
      </Card>

      <Card
        title="تقویم ماهانه"
        subtitle={`وضعیت روتین انتخاب‌شده روی روزهای ${formatPersianMonthYear(monthDays[0] || todayISO)}`}
      >
        <div className="routine-badges">
          {!routines.length ? (
            <p className="muted">ابتدا یک روتین تعریف کنید.</p>
          ) : (
            routines.map((routine) => (
              <button
                key={routine.id}
                className={`routine-badge ${selectedRoutineId === routine.id ? "active" : ""}`.trim()}
                onClick={() => setSelectedRoutineId(routine.id)}
                style={{
                  borderColor: routine.color || "#d5deff",
                  color:
                    selectedRoutineId === routine.id
                      ? "#1b2c63"
                      : routine.color || "#243568",
                }}
              >
                <span
                  className="routine-color-dot"
                  style={{ backgroundColor: routine.color || "#9fb6ff" }}
                />
                {routine.title}
              </button>
            ))
          )}
        </div>

        <div className="monthly-calendar-shell">
          <div className="monthly-calendar-header">
            <button className="btn btn-secondary" onClick={goToPreviousMonth}>
              ماه قبل
            </button>
            <p className="monthly-calendar-title">
              {formatPersianMonthYear(monthDays[0] || todayISO)}
            </p>
            <button className="btn btn-secondary" onClick={goToNextMonth}>
              ماه بعد
            </button>
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
              const status = getSelectedRoutineDayStatus(cell.isoDate);
              const cellClass = [
                "monthly-day",
                !cell.inCurrentMonth ? "other-month" : "",
                status === "done" ? "task-day-done" : "",
                status === "missed" ? "task-day-missed" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={cell.isoDate}
                  className={cellClass}
                  onClick={() =>
                    handleDayClick(cell.isoDate, cell.inCurrentMonth)
                  }
                >
                  <span>{dayParts.day}</span>
                </button>
              );
            })}
          </div>
        </div>

        <StatGrid data={monthlyReport} />
      </Card>

      {isAddModalOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingRoutineId(null);
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {editingRoutineId ? "ویرایش روتین" : "افزودن روتین جدید"}
            </h3>
            <form className="stack" onSubmit={createRoutine}>
              <div className="routine-form-row">
                <input
                  id="newRoutineTitle"
                  className="input routine-title-input"
                  placeholder="نام روتین"
                  value={newRoutineTitle}
                  onChange={(e) => setNewRoutineTitle(e.target.value)}
                  required
                />
                <input
                  id="newRoutineColor"
                  type="color"
                  className="input routine-color-input routine-color-inline"
                  value={newRoutineColor}
                  onChange={(e) => setNewRoutineColor(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingRoutineId(null);
                  }}
                >
                  انصراف
                </Button>
                <Button type="submit">
                  {editingRoutineId ? "ذخیره تغییرات" : "ثبت روتین"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {routineToDelete ? (
        <div
          className="modal-backdrop"
          onClick={() => setRoutineToDelete(null)}
        >
          <div
            className="modal-card delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">تأیید حذف روتین</h3>
            <p className="muted delete-confirm-text">
              آیا از حذف روتین «{routineToDelete.title}» مطمئن هستید؟
            </p>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setRoutineToDelete(null)}
              >
                انصراف
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await removeRoutine(routineToDelete.id);
                  setRoutineToDelete(null);
                }}
              >
                حذف روتین
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {snackbar.open ? (
        <div
          className={`snackbar ${snackbar.type === "error" ? "error" : "success"}`}
        >
          {snackbar.message}
        </div>
      ) : null}
    </AppShell>
  );
}
