import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Snackbar from "../components/ui/Snackbar";
import WeeklyRoutines from "../components/sections/WeeklyRoutines";
import MonthlyCalendar from "../components/sections/MonthlyCalendar";
import DailyTasks from "../components/sections/DailyTasks";
import { api } from "../lib/api";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  formatPersianMonthYear,
  getGregorianDatesForPersianMonth,
  getPersianMonthFromISO,
  getTodayISO,
  getWeekDaysGregorian,
  getWeekStartISO,
  shiftPersianMonth,
  shiftISODate,
} from "../lib/date";
import "./HomePage.css";

function ReportChart({ routinesReport }) {
  if (!routinesReport?.length) {
    return <p className="muted">برای چارت، ابتدا روتین ثبت کنید.</p>;
  }

  const maxSingle = Math.max(
    ...routinesReport.map((item) =>
      Math.max(item.done, item.missed, item.remaining),
    ),
    1,
  );

  return (
    <div className="report-chart-wrap">
      <div className="report-chart-legend">
        <span>
          <i className="legend-dot done" />
          انجام‌شده
        </span>
        <span>
          <i className="legend-dot missed" />
          انجام‌نشده
        </span>
        <span>
          <i className="legend-dot remaining" />
          ثبت‌نشده
        </span>
      </div>

      <div className="routine-report-chart">
        {routinesReport.map((routine) => {
          const total = routine.done + routine.missed + routine.remaining;

          return (
            <div className="routine-report-col" key={routine.id}>
              <div className="clustered-bars">
                <div
                  className="cluster-bar done"
                  style={{
                    height: `${Math.max((routine.done / maxSingle) * 100, 8)}%`,
                  }}
                  title={`انجام‌شده: ${routine.done}`}
                />
                <div
                  className="cluster-bar missed"
                  style={{
                    height: `${Math.max((routine.missed / maxSingle) * 100, 8)}%`,
                  }}
                  title={`انجام‌نشده: ${routine.missed}`}
                />
                <div
                  className="cluster-bar remaining"
                  style={{
                    height: `${Math.max((routine.remaining / maxSingle) * 100, 8)}%`,
                  }}
                  title={`ثبت‌نشده: ${routine.remaining}`}
                />
              </div>

              <div className="routine-report-meta">
                <span className="routine-report-total">{total}</span>
                <span className="routine-report-name" title={routine.title}>
                  {routine.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
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

function buildRoutineStatsForDays(days, routines, logsMap) {
  return routines.map((routine) => {
    let done = 0;
    let missed = 0;

    days.forEach((day) => {
      const status = logsMap.get(`${routine.id}-${day}`);
      if (status === "done") done += 1;
      if (status === "missed") missed += 1;
    });

    return {
      id: routine.id,
      title: routine.title,
      done,
      missed,
      remaining: Math.max(days.length - done - missed, 0),
    };
  });
}

function getNextStatus(current) {
  if (current === "done") return "missed";
  if (current === "missed") return "done";
  return "done";
}

function getDefaultRoutineColor() {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--color-primary")
    .trim();
}

export default function HomePage() {
  const [month, setMonth] = useState(() =>
    getPersianMonthFromISO(getTodayISO()),
  );
  const [tasksMonth, setTasksMonth] = useState(() =>
    getPersianMonthFromISO(getTodayISO()),
  );
  const [weekStart, setWeekStart] = useState(getWeekStartISO(getTodayISO()));
  const todayISO = useMemo(() => getTodayISO(), []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [activeTab, setActiveTab] = useState("weekly");
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineColor, setNewRoutineColor] = useState(() =>
    getDefaultRoutineColor(),
  );
  const [selectedMonthlyDate, setSelectedMonthlyDate] = useState(getTodayISO());
  const [tasksDate, setTasksDate] = useState(getTodayISO());
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [logsMap, setLogsMap] = useState(new Map());
  const [error, setError] = useState("");
  const { snackbar, notify } = useSnackbar();

  const monthDays = useMemo(
    () => getGregorianDatesForPersianMonth(month),
    [month],
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

  const monthlyReport = useMemo(() => {
    const allRoutinesStats = buildStatsForDays(monthDays, routines, logsMap);

    if (!selectedRoutineId) return allRoutinesStats;

    const selectedRoutine = routines.find(
      (routine) => routine.id === selectedRoutineId,
    );

    if (!selectedRoutine) return allRoutinesStats;

    const selectedRoutineStats = buildStatsForDays(
      monthDays,
      [selectedRoutine],
      logsMap,
    );

    return {
      ...selectedRoutineStats,
      routines: routines.length,
    };
  }, [monthDays, routines, logsMap, selectedRoutineId]);

  const monthlyRoutineReport = useMemo(
    () => buildRoutineStatsForDays(monthDays, routines, logsMap),
    [monthDays, routines, logsMap],
  );

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
      notify(err.message, "error");
    }
  }

  useEffect(() => {
    load();
  }, [month, requestStartDate, requestEndDate]);

  useEffect(() => {
    if (activeTab !== "tasks") return;
    loadTasks();
  }, [activeTab, tasksDate]);

  useEffect(() => {
    setTasksMonth(getPersianMonthFromISO(tasksDate));
  }, [tasksDate]);

  async function toggleStatus(routineId, date) {
    if (date > todayISO) {
      notify("ثبت وضعیت برای تاریخ آینده مجاز نیست.", "warn");
      return;
    }

    try {
      const key = `${routineId}-${date}`;
      const next = getNextStatus(logsMap.get(key));
      await api.upsertLog({ routine_id: routineId, date, status: next });
      notify("وضعیت روتین با موفقیت ثبت شد.", "success");
      await load();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
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
      setNewRoutineColor(getDefaultRoutineColor());
      setEditingRoutineId(null);
      setIsAddModalOpen(false);
      notify(
        editingRoutineId
          ? "روتین با موفقیت ویرایش شد."
          : "روتین جدید با موفقیت ساخته شد.",
        "success",
      );
      await load();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
  }

  async function removeRoutine(id) {
    try {
      await api.deleteRoutine(id);
      notify("روتین حذف شد.", "success");
      await load();
    } catch (err) {
      setError(err.message);
      notify(err.message, "error");
    }
  }

  function openAddModal() {
    setEditingRoutineId(null);
    setNewRoutineTitle("");
    setNewRoutineColor(getDefaultRoutineColor());
    setIsAddModalOpen(true);
  }

  function openEditModal(routine) {
    setEditingRoutineId(routine.id);
    setNewRoutineTitle(routine.title || "");
    setNewRoutineColor(routine.color || getDefaultRoutineColor());
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

  function goToTodayMonthly() {
    setMonth(getPersianMonthFromISO(todayISO));
    setSelectedMonthlyDate(todayISO);
  }

  function goToTodayTasks() {
    setTasksMonth(getPersianMonthFromISO(todayISO));
    setTasksDate(todayISO);
  }

  function getSelectedRoutineDayStatus(isoDate) {
    if (!selectedRoutineId) return null;
    return logsMap.get(`${selectedRoutineId}-${isoDate}`) || null;
  }

  function openMonthlyReportChart() {
    setReportModal({
      title: "چارت گزارش ماهانه",
      routinesReport: monthlyRoutineReport,
    });
  }

  async function loadTasks() {
    try {
      setTasksLoading(true);
      const rows = await api.getDailyTasks(tasksDate);
      setTasks(rows);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setTasksLoading(false);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    const content = newTaskText.trim();
    if (!content) return;

    try {
      await api.createDailyTask({ date: tasksDate, content });
      setNewTaskText("");
      await loadTasks();
      notify("کار جدید اضافه شد.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function toggleTaskDone(task) {
    try {
      await api.updateDailyTask(task.id, { is_done: !task.is_done });
      await loadTasks();
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function deleteTask(taskId) {
    try {
      await api.deleteDailyTask(taskId);
      await loadTasks();
      notify("کار حذف شد.", "success");
      setTaskToDelete(null);
    } catch (err) {
      notify(err.message, "error");
    }
  }

  function changeTab(nextTab) {
    setActiveTab(nextTab);
    setReportModal(null);
    setTaskToDelete(null);
  }

  return (
    <AppShell title="هدفی‌نو">
      <div className="nav-tabs page-tabs">
        <button
          type="button"
          className={`tab tab-btn ${activeTab === "weekly" ? "active" : ""}`.trim()}
          onClick={() => changeTab("weekly")}
        >
          روتین‌های من
        </button>
        <button
          type="button"
          className={`tab tab-btn ${activeTab === "monthly" ? "active" : ""}`.trim()}
          onClick={() => changeTab("monthly")}
        >
          تقویم ماهانه
        </button>
        <button
          type="button"
          className={`tab tab-btn ${activeTab === "tasks" ? "active" : ""}`.trim()}
          onClick={() => changeTab("tasks")}
        >
          کارهای روزانه
        </button>
      </div>

      {activeTab === "weekly" ? (
        <WeeklyRoutines
          error={error}
          openAddModal={openAddModal}
          goToPreviousWeek={goToPreviousWeek}
          goToNextWeek={goToNextWeek}
          canGoNextWeek={canGoNextWeek}
          weekDays={weekDays}
          routines={routines}
          logsMap={logsMap}
          todayISO={todayISO}
          openEditModal={openEditModal}
          onRequestRoutineDelete={setRoutineToDelete}
          toggleStatus={toggleStatus}
        />
      ) : null}

      {activeTab === "monthly" ? (
        <MonthlyCalendar
          subtitle={`وضعیت روتین انتخاب‌شده روی روزهای ${formatPersianMonthYear(monthDays[0] || todayISO)}`}
          routines={routines}
          selectedRoutineId={selectedRoutineId}
          setSelectedRoutineId={setSelectedRoutineId}
          month={month}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
          goToTodayMonthly={goToTodayMonthly}
          selectedMonthlyDate={selectedMonthlyDate}
          setSelectedMonthlyDate={setSelectedMonthlyDate}
          getSelectedRoutineDayStatus={getSelectedRoutineDayStatus}
          monthlyReport={monthlyReport}
          onOpenMonthlyChart={openMonthlyReportChart}
        />
      ) : null}

      {activeTab === "tasks" ? (
        <DailyTasks
          tasksMonth={tasksMonth}
          setTasksMonth={setTasksMonth}
          goToTodayTasks={goToTodayTasks}
          tasksDate={tasksDate}
          setTasksDate={setTasksDate}
          newTaskText={newTaskText}
          setNewTaskText={setNewTaskText}
          createTask={createTask}
          tasksLoading={tasksLoading}
          tasks={tasks}
          toggleTaskDone={toggleTaskDone}
          onRequestTaskDelete={setTaskToDelete}
        />
      ) : null}

      <Modal
        isOpen={Boolean(reportModal)}
        onClose={() => setReportModal(null)}
        title={reportModal?.title}
        className="chart-modal"
      >
        <ReportChart routinesReport={reportModal?.routinesReport} />
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setReportModal(null)}>
            بستن
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRoutineId(null);
        }}
        title={editingRoutineId ? "ویرایش روتین" : "افزودن روتین جدید"}
      >
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
              type="button"
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
      </Modal>

      <Modal
        isOpen={Boolean(routineToDelete)}
        onClose={() => setRoutineToDelete(null)}
        title="تأیید حذف روتین"
        className="delete-confirm-modal"
      >
        <p className="muted delete-confirm-text">
          آیا از حذف روتین «{routineToDelete?.title}» مطمئن هستید؟
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setRoutineToDelete(null)}>
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
      </Modal>

      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="تأیید حذف کار"
        className="delete-confirm-modal"
      >
        <p className="muted delete-confirm-text">
          آیا از حذف کار «{taskToDelete?.content}» مطمئن هستید؟
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setTaskToDelete(null)}>
            انصراف
          </Button>
          <Button variant="danger" onClick={() => deleteTask(taskToDelete.id)}>
            حذف کار
          </Button>
        </div>
      </Modal>

      <Snackbar
        open={snackbar.open}
        type={snackbar.type}
        message={snackbar.message}
      />
    </AppShell>
  );
}
