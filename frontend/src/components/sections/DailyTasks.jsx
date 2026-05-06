import { memo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import DatePicker from "../ui/DatePicker";
import {
  formatDateParts,
  formatMonthYear,
  shiftMonthCursor,
} from "../../lib/date";
import { t } from "../../lib/i18n";
// DailyTasks styles moved to Tailwind utilities in component

const TaskListItem = memo(function TaskListItem({
  task,
  onEdit,
  onDelete,
  onToggle,
  language,
}) {
  return (
    <li className="daily-task-item">
      <IconButton
        icon="fa-solid fa-pen"
        label={t("dailyTasks.editTask", language)}
        onClick={() => onEdit(task)}
      />
      <IconButton
        icon="fa-solid fa-trash"
        label={t("dailyTasks.deleteTask", language)}
        className="delete"
        onClick={() => onDelete(task)}
      />
      <button
        className={`daily-task-check ${task.is_done ? "done" : ""}`.trim()}
        onClick={() => onToggle(task)}
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
      <span className={`daily-task-text ${task.is_done ? "done" : ""}`.trim()}>
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
  );
});

function DailyTasks({
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
      <DatePicker
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
        <Button icon="fa-solid fa-plus" onClick={onOpenAddTaskModal}>
          {t("dailyTasks.add", language)}
        </Button>
      </div>

      {tasksLoading ? (
        <p className="text-text-muted">{t("dailyTasks.loading", language)}</p>
      ) : null}

      {!tasksLoading && !tasks.length ? (
        <p className="mt-3 border rounded-md p-3 text-center text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-soft)]">
          {t("dailyTasks.noTasks", language)}
        </p>
      ) : null}

      <ul className="daily-tasks-list">
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onEdit={onOpenEditTaskModal}
            onDelete={onRequestTaskDelete}
            onToggle={toggleTaskDone}
            language={language}
          />
        ))}
      </ul>
    </Card>
  );
}

export default memo(DailyTasks);
