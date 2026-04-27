import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Snackbar from "../components/ui/Snackbar";
import WeeklyRoutines from "../components/sections/WeeklyRoutines";
import MonthlyCalendar from "../components/sections/MonthlyCalendar";
import DailyTasks from "../components/sections/DailyTasks";
import Notes from "../components/sections/Notes";
import { api } from "../lib/api";
import { useSnackbar } from "../hooks/useSnackbar";
import { useSettings } from "../lib/settings";
import { t } from "../lib/i18n";
import {
  formatMonthYear,
  getGregorianDatesForCalendarMonth,
  getMonthCursorFromISO,
  getTodayISO,
  getWeekDaysGregorian,
  getWeekStartISO,
  shiftMonthCursor,
  shiftISODate,
} from "../lib/date";
import "./HomePage.css";

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

function requestNotificationPermissionIfNeeded() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export default function HomePage() {
  const { language, calendarType } = useSettings();
  const todayISO = useMemo(() => getTodayISO(), []);
  const [month, setMonth] = useState(() =>
    getMonthCursorFromISO(todayISO, calendarType),
  );
  const [tasksMonth, setTasksMonth] = useState(() =>
    getMonthCursorFromISO(todayISO, calendarType),
  );
  const [weekStart, setWeekStart] = useState(getWeekStartISO(getTodayISO()));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("weekly");
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineColor, setNewRoutineColor] = useState(() =>
    getDefaultRoutineColor(),
  );
  const [newRoutineAlarmEnabled, setNewRoutineAlarmEnabled] = useState(false);
  const [newRoutineAlarmTime, setNewRoutineAlarmTime] = useState("09:00");
  const [selectedMonthlyDate, setSelectedMonthlyDate] = useState(getTodayISO());
  const [tasksDate, setTasksDate] = useState(getTodayISO());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [alarmTasks, setAlarmTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAlarmEnabled, setNewTaskAlarmEnabled] = useState(false);
  const [newTaskAlarmTime, setNewTaskAlarmTime] = useState("09:00");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskDatesWithEntries, setTaskDatesWithEntries] = useState(new Set());
  const [notes, setNotes] = useState([]);
  const [notesSearch, setNotesSearch] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [logsMap, setLogsMap] = useState(new Map());
  const [error, setError] = useState("");
  const firedAlarmKeysRef = useRef(new Set());
  const { snackbar, notify } = useSnackbar();

  const monthDays = useMemo(
    () => getGregorianDatesForCalendarMonth(month),
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
    if (activeTab !== "tasks") return;
    loadTaskDatesForMonth(tasksMonth);
  }, [activeTab, tasksMonth]);

  useEffect(() => {
    if (activeTab !== "notes") return;
    const timeoutId = setTimeout(() => {
      loadNotes();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [activeTab, notesSearch]);

  useEffect(() => {
    setTasksMonth(getMonthCursorFromISO(tasksDate, calendarType));
  }, [tasksDate, calendarType]);

  useEffect(() => {
    setMonth((prev) =>
      getMonthCursorFromISO(selectedMonthlyDate, calendarType),
    );
  }, [calendarType, selectedMonthlyDate]);

  useEffect(() => {
    if (!newRoutineAlarmEnabled && !newTaskAlarmEnabled) return;
    requestNotificationPermissionIfNeeded();
  }, [newRoutineAlarmEnabled, newTaskAlarmEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function loadTodayTasksForAlarms() {
      try {
        const rows = await api.getDailyTasks(getTodayISO());
        if (!cancelled) setAlarmTasks(rows);
      } catch {
        if (!cancelled) setAlarmTasks([]);
      }
    }

    loadTodayTasksForAlarms();
    const intervalId = setInterval(loadTodayTasksForAlarms, 60_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const todayISODate = getTodayISO();
      const hhmm = now.toTimeString().slice(0, 5);

      const notifyAlarm = (key, title, body) => {
        if (firedAlarmKeysRef.current.has(key)) return;
        firedAlarmKeysRef.current.add(key);

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(title, { body });
          return;
        }

        notify(`${title}: ${body}`, "warn");
      };

      routines
        .filter(
          (routine) =>
            routine.is_active &&
            routine.alarm_enabled &&
            routine.alarm_time === hhmm,
        )
        .forEach((routine) => {
          notifyAlarm(
            `routine-${routine.id}-${todayISODate}-${hhmm}`,
            t("notifications.routineAlarmTitle", language),
            t("notifications.routineAlarmBody", language, {
              title: routine.title,
            }),
          );
        });

      alarmTasks
        .filter(
          (task) =>
            task.task_date === todayISODate &&
            !task.is_done &&
            task.alarm_enabled &&
            task.alarm_time === hhmm,
        )
        .forEach((task) => {
          notifyAlarm(
            `task-${task.id}-${todayISODate}-${hhmm}`,
            t("notifications.taskAlarmTitle", language),
            t("notifications.taskAlarmBody", language, {
              content: task.content,
            }),
          );
        });
    }, 15_000);

    return () => clearInterval(intervalId);
  }, [routines, alarmTasks, notify]);

  async function toggleStatus(routineId, date) {
    if (date > todayISO) {
      notify(t("notifications.statusFutureDateWarn", language), "warn");
      return;
    }

    try {
      const key = `${routineId}-${date}`;
      const next = getNextStatus(logsMap.get(key));
      await api.upsertLog({ routine_id: routineId, date, status: next });
      notify(t("notifications.routineStatusSaved", language), "success");
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
          alarm_enabled: newRoutineAlarmEnabled,
          alarm_time: newRoutineAlarmEnabled ? newRoutineAlarmTime : null,
        });
      } else {
        await api.createRoutine({
          title: newRoutineTitle.trim(),
          color: newRoutineColor,
          alarm_enabled: newRoutineAlarmEnabled,
          alarm_time: newRoutineAlarmEnabled ? newRoutineAlarmTime : null,
        });
      }
      setNewRoutineTitle("");
      setNewRoutineColor(getDefaultRoutineColor());
      setNewRoutineAlarmEnabled(false);
      setNewRoutineAlarmTime("09:00");
      setEditingRoutineId(null);
      setIsAddModalOpen(false);
      notify(
        editingRoutineId
          ? t("notifications.routineEdited", language)
          : t("notifications.routineCreated", language),
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
      notify(t("notifications.routineDeleted", language), "success");
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
    setNewRoutineAlarmEnabled(false);
    setNewRoutineAlarmTime("09:00");
    setIsAddModalOpen(true);
  }

  function openEditModal(routine) {
    setEditingRoutineId(routine.id);
    setNewRoutineTitle(routine.title || "");
    setNewRoutineColor(routine.color || getDefaultRoutineColor());
    setNewRoutineAlarmEnabled(Boolean(routine.alarm_enabled));
    setNewRoutineAlarmTime(routine.alarm_time || "09:00");
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
    setMonth((prev) => shiftMonthCursor(prev, -1));
  }

  function goToNextMonth() {
    setMonth((prev) => shiftMonthCursor(prev, 1));
  }

  function goToTodayMonthly() {
    setMonth(getMonthCursorFromISO(todayISO, calendarType));
    setSelectedMonthlyDate(todayISO);
  }

  function goToTodayTasks() {
    setTasksMonth(getMonthCursorFromISO(todayISO, calendarType));
    setTasksDate(todayISO);
  }

  function openCreateTaskModal() {
    setEditingTask(null);
    setNewTaskText("");
    setNewTaskAlarmEnabled(false);
    setNewTaskAlarmTime("09:00");
    setIsTaskModalOpen(true);
  }

  function openEditTaskModal(task) {
    setEditingTask(task);
    setNewTaskText(task.content || "");
    setNewTaskAlarmEnabled(Boolean(task.alarm_enabled));
    setNewTaskAlarmTime(task.alarm_time || "09:00");
    setIsTaskModalOpen(true);
  }

  function closeTaskModal() {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setNewTaskText("");
    setNewTaskAlarmEnabled(false);
    setNewTaskAlarmTime("09:00");
  }

  function getSelectedRoutineDayStatus(isoDate) {
    if (!selectedRoutineId) return null;
    return logsMap.get(`${selectedRoutineId}-${isoDate}`) || null;
  }

  function getTaskDayBadge(isoDate) {
    return taskDatesWithEntries.has(isoDate) ? "has-entries" : null;
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

  async function loadTaskDatesForMonth(targetMonth) {
    const monthDays = getGregorianDatesForCalendarMonth(targetMonth);
    if (!monthDays.length) {
      setTaskDatesWithEntries(new Set());
      return;
    }

    try {
      const startDate = monthDays[0];
      const endDate = monthDays[monthDays.length - 1];
      const rows = await api.getDailyTasksRange(startDate, endDate);
      const nextDates = new Set(rows.map((row) => row.task_date));
      setTaskDatesWithEntries(nextDates);
    } catch {
      setTaskDatesWithEntries(new Set());
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    const content = newTaskText.trim();
    if (!content) return;

    try {
      if (editingTask?.id) {
        await api.updateDailyTask(editingTask.id, {
          content,
          alarm_enabled: newTaskAlarmEnabled,
          alarm_time: newTaskAlarmEnabled ? newTaskAlarmTime : null,
        });
      } else {
        await api.createDailyTask({
          date: tasksDate,
          content,
          alarm_enabled: newTaskAlarmEnabled,
          alarm_time: newTaskAlarmEnabled ? newTaskAlarmTime : null,
        });
      }

      closeTaskModal();
      await loadTasks();
      const todayISODate = getTodayISO();
      if (tasksDate === todayISODate) {
        const rows = await api.getDailyTasks(todayISODate);
        setAlarmTasks(rows);
      }
      await loadTaskDatesForMonth(tasksMonth);
      notify(
        editingTask?.id
          ? t("notifications.taskEdited", language)
          : t("notifications.taskCreated", language),
        "success",
      );
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function toggleTaskDone(task) {
    try {
      await api.updateDailyTask(task.id, { is_done: !task.is_done });
      await loadTasks();
      await loadTaskDatesForMonth(tasksMonth);
      if (task.task_date === getTodayISO()) {
        const rows = await api.getDailyTasks(getTodayISO());
        setAlarmTasks(rows);
      }
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function deleteTask(taskId) {
    try {
      await api.deleteDailyTask(taskId);
      await loadTasks();
      await loadTaskDatesForMonth(tasksMonth);
      const rows = await api.getDailyTasks(getTodayISO());
      setAlarmTasks(rows);
      notify(t("notifications.taskDeleted", language), "success");
      setTaskToDelete(null);
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function loadNotes() {
    try {
      setNotesLoading(true);
      const q = notesSearch.trim();
      const query = q ? `?q=${encodeURIComponent(q)}` : "";
      const rows = await api.getNotes(query);
      setNotes(rows);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setNotesLoading(false);
    }
  }

  function openCreateNoteModal() {
    setEditingNote(null);
    setNoteText("");
    setIsNoteModalOpen(true);
  }

  function openEditNoteModal(note) {
    setEditingNote(note);
    setNoteText(note.content || "");
    setIsNoteModalOpen(true);
  }

  async function submitNote(event) {
    event.preventDefault();
    const content = noteText.trim();
    if (!content) return;

    try {
      if (editingNote?.id) {
        await api.updateNote(editingNote.id, { content });
      } else {
        await api.createNote({ content });
      }

      setIsNoteModalOpen(false);
      setEditingNote(null);
      setNoteText("");
      await loadNotes();
      notify(
        editingNote?.id
          ? t("notifications.noteEdited", language)
          : t("notifications.noteCreated", language),
        "success",
      );
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function deleteNote(noteId) {
    try {
      await api.deleteNote(noteId);
      await loadNotes();
      setNoteToDelete(null);
      notify(t("notifications.noteDeleted", language), "success");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  function changeTab(nextTab) {
    setActiveTab(nextTab);
    closeTaskModal();
    setTaskToDelete(null);
    setNoteToDelete(null);
  }

  return (
    <AppShell title={t("header.title", language)}>
      <div className="nav-tabs page-tabs">
        <button
          type="button"
          className={`tab tab-btn ${activeTab === "weekly" ? "active" : ""}`.trim()}
          onClick={() => changeTab("weekly")}
        >
          {t("weekly.title", language)}
        </button>
        <button
          type="button"
          className={`tab tab-btn ${activeTab === "tasks" ? "active" : ""}`.trim()}
          onClick={() => changeTab("tasks")}
        >
          {t("dailyTasks.title", language)}
        </button>
        <button
          type="button"
          className={`tab tab-btn ${activeTab === "notes" ? "active" : ""}`.trim()}
          onClick={() => changeTab("notes")}
        >
          {t("notes.title", language)}
        </button>
      </div>

      {activeTab === "weekly" ? (
        <>
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
            language={language}
            calendarType={calendarType}
          />
          <MonthlyCalendar
            subtitle={`${t("weekly.subtitle", language)} ${formatMonthYear(
              monthDays[0] || todayISO,
              language,
              calendarType,
            )}`}
            routines={routines}
            selectedRoutineId={selectedRoutineId}
            setSelectedRoutineId={setSelectedRoutineId}
            month={month}
            setMonth={setMonth}
            goToPreviousMonth={goToPreviousMonth}
            goToNextMonth={goToNextMonth}
            goToTodayMonthly={goToTodayMonthly}
            selectedMonthlyDate={selectedMonthlyDate}
            setSelectedMonthlyDate={setSelectedMonthlyDate}
            getSelectedRoutineDayStatus={getSelectedRoutineDayStatus}
            monthlyReport={monthlyReport}
            monthlyRoutineReport={monthlyRoutineReport}
            language={language}
            calendarType={calendarType}
          />
        </>
      ) : null}

      {activeTab === "tasks" ? (
        <DailyTasks
          tasksMonth={tasksMonth}
          setTasksMonth={setTasksMonth}
          goToTodayTasks={goToTodayTasks}
          tasksDate={tasksDate}
          setTasksDate={setTasksDate}
          onOpenAddTaskModal={openCreateTaskModal}
          onOpenEditTaskModal={openEditTaskModal}
          tasksLoading={tasksLoading}
          tasks={tasks}
          getTaskDayBadge={getTaskDayBadge}
          toggleTaskDone={toggleTaskDone}
          onRequestTaskDelete={setTaskToDelete}
          language={language}
          calendarType={calendarType}
        />
      ) : null}

      {activeTab === "notes" ? (
        <Notes
          notes={notes}
          notesLoading={notesLoading}
          notesSearch={notesSearch}
          setNotesSearch={setNotesSearch}
          onOpenAdd={openCreateNoteModal}
          onOpenEdit={openEditNoteModal}
          onRequestDelete={setNoteToDelete}
          language={language}
          calendarType={calendarType}
        />
      ) : null}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRoutineId(null);
          setNewRoutineAlarmEnabled(false);
          setNewRoutineAlarmTime("09:00");
        }}
        title={
          editingRoutineId
            ? t("weekly.editRoutine", language)
            : t("weekly.addRoutine", language)
        }
      >
        <form className="stack" onSubmit={createRoutine}>
          <div className="routine-form-row">
            <input
              id="newRoutineTitle"
              className="input routine-title-input"
              placeholder={t("weekly.routineNamePlaceholder", language)}
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
          <label className="routine-alarm-toggle">
            <input
              type="checkbox"
              checked={newRoutineAlarmEnabled}
              onChange={(e) => setNewRoutineAlarmEnabled(e.target.checked)}
            />
            {t("weekly.enableAlarm", language)}
          </label>
          <input
            type="time"
            className="input"
            value={newRoutineAlarmTime}
            onChange={(e) => setNewRoutineAlarmTime(e.target.value)}
            disabled={!newRoutineAlarmEnabled}
            required={newRoutineAlarmEnabled}
          />
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingRoutineId(null);
                setNewRoutineAlarmEnabled(false);
                setNewRoutineAlarmTime("09:00");
              }}
            >
              {t("common.cancel", language)}
            </Button>
            <Button type="submit">
              {editingRoutineId
                ? t("weekly.saveRoutineChanges", language)
                : t("weekly.createRoutine", language)}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(routineToDelete)}
        onClose={() => setRoutineToDelete(null)}
        title={t("weekly.confirmDeleteRoutineTitle", language)}
        className="delete-confirm-modal"
      >
        <p className="muted delete-confirm-text">
          {t("weekly.confirmDeleteRoutineMessage", language, {
            title: routineToDelete?.title || "",
          })}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setRoutineToDelete(null)}>
            {t("common.cancel", language)}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await removeRoutine(routineToDelete.id);
              setRoutineToDelete(null);
            }}
          >
            {t("weekly.deleteRoutine", language)}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        title={
          editingTask
            ? t("dailyTasks.editTask", language)
            : t("dailyTasks.add", language)
        }
      >
        <form className="stack" onSubmit={submitTask}>
          <input
            className="input"
            placeholder={t("dailyTasks.taskPlaceholder", language)}
            value={newTaskText}
            onChange={(event) => setNewTaskText(event.target.value)}
            required
          />
          <label className="routine-alarm-toggle">
            <input
              type="checkbox"
              checked={newTaskAlarmEnabled}
              onChange={(event) => setNewTaskAlarmEnabled(event.target.checked)}
            />
            {t("dailyTasks.enableAlarm", language)}
          </label>
          <input
            type="time"
            className="input"
            value={newTaskAlarmTime}
            onChange={(event) => setNewTaskAlarmTime(event.target.value)}
            disabled={!newTaskAlarmEnabled}
            required={newTaskAlarmEnabled}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeTaskModal}>
              {t("common.cancel", language)}
            </Button>
            <Button type="submit">
              {editingTask
                ? t("dailyTasks.saveTaskChanges", language)
                : t("dailyTasks.createTask", language)}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title={t("dailyTasks.confirmDeleteTaskTitle", language)}
        className="delete-confirm-modal"
      >
        <p className="muted delete-confirm-text">
          {t("dailyTasks.confirmDeleteTaskMessage", language, {
            content: taskToDelete?.content || "",
          })}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setTaskToDelete(null)}>
            {t("common.cancel", language)}
          </Button>
          <Button variant="danger" onClick={() => deleteTask(taskToDelete.id)}>
            {t("dailyTasks.deleteTask", language)}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        title={
          editingNote ? t("notes.edit", language) : t("notes.add", language)
        }
      >
        <form className="stack" onSubmit={submitNote}>
          <textarea
            className="input note-form-textarea"
            placeholder={t("notes.notePlaceholder", language)}
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            required
          />
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsNoteModalOpen(false);
                setEditingNote(null);
              }}
            >
              {t("common.cancel", language)}
            </Button>
            <Button type="submit">
              {editingNote
                ? t("notes.edit", language)
                : t("notes.add", language)}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(noteToDelete)}
        onClose={() => setNoteToDelete(null)}
        title={t("notes.confirmDeleteTitle", language)}
        className="delete-confirm-modal"
      >
        <p className="muted delete-confirm-text">
          {t("notes.confirmDeleteMessage", language)}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setNoteToDelete(null)}>
            {t("common.cancel", language)}
          </Button>
          <Button variant="danger" onClick={() => deleteNote(noteToDelete.id)}>
            {t("notes.delete", language)}
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
