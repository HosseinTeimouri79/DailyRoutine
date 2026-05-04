import Card from "../ui/Card";
import Button from "../ui/Button";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";
import {
  formatDateParts,
  formatMonthYear,
  shiftMonthCursor,
} from "../../lib/date";
import { t } from "../../lib/i18n";
import "./DailyTasks.css";

export default function DailyTasks({
  tasksMonth,
  setTasksMonth,
  goToTodayTasks,
  tasksDate,
  setTasksDate,
  getTaskDayBadge,
  onOpenAddTaskModal,
  onOpenEditTaskModal,
  tasksLoading,
  tasks,
  toggleTaskDone,
  onRequestTaskDelete,
  language,
  calendarType,
}) {
  return (
    <Card
      title={t("dailyTasks.title", language)}
      subtitle={t("dailyTasks.subtitle", language)}
    >
      <PersianMonthCalendar
        className="daily-tasks-calendar"
        month={tasksMonth}
        calendarType={calendarType}
        onPrevMonth={() => setTasksMonth((prev) => shiftMonthCursor(prev, -1))}
        onNextMonth={() => setTasksMonth((prev) => shiftMonthCursor(prev, 1))}
        onSetMonth={setTasksMonth}
        onGoToday={goToTodayTasks}
        selectedDate={tasksDate}
        onSelectDay={setTasksDate}
        getDayBadge={getTaskDayBadge}
        language={language}
      />

      <div className="daily-tasks-toolbar">
        <p className="muted tasks-selected-date">
          {t("dailyTasks.selectedDate", language)}:{" "}
          {formatDateParts(tasksDate, language, calendarType).day}{" "}
          {formatMonthYear(tasksDate, language, calendarType)}
        </p>
        <Button onClick={onOpenAddTaskModal}>
          {t("dailyTasks.add", language)}
        </Button>
      </div>

      {tasksLoading ? (
        <p className="muted">{t("dailyTasks.loading", language)}</p>
      ) : null}

      {!tasksLoading && !tasks.length ? (
        <p className="empty-state-message">
          {t("dailyTasks.noTasks", language)}
        </p>
      ) : null}

      <ul className="daily-tasks-list">
        {tasks.map((task) => (
          <li key={task.id} className="daily-task-item">
            <button
              className="icon-btn"
              onClick={() => onOpenEditTaskModal(task)}
              title={t("dailyTasks.editTask", language)}
            >
              <i className="fa-solid fa-pen" aria-hidden="true" />
            </button>
            <button
              className="icon-btn delete"
              onClick={() => onRequestTaskDelete(task)}
              title={t("dailyTasks.deleteTask", language)}
            >
              <i className="fa-solid fa-trash" aria-hidden="true" />
            </button>
            <button
              className={`daily-task-check ${task.is_done ? "done" : ""}`.trim()}
              onClick={() => toggleTaskDone(task)}
              title={
                task.is_done
                  ? t("dailyTasks.markUndone", language)
                  : t("dailyTasks.markDone", language)
              }
            >
              <i
                className={
                  task.is_done ? "fa-solid fa-check" : "fa-regular fa-circle"
                }
                aria-hidden="true"
              />
            </button>
            <span
              className={`daily-task-text ${task.is_done ? "done" : ""}`.trim()}
            >
              {task.content}
            </span>
            {task.alarm_enabled && task.alarm_time ? (
              <span
                className="daily-task-alarm-badge"
                title={t("common.alarmTime", language)}
              >
                <i className="fa-regular fa-clock" aria-hidden="true" />
                {task.alarm_time}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
