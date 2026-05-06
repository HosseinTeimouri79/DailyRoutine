import { memo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import DatePicker from "../ui/DatePicker";
import Checkbox from "../ui/Checkbox";
import {
  formatDateParts,
  formatMonthYear,
  shiftMonthCursor,
} from "../../lib/date";
import { t } from "../../lib/i18n";

const TaskListItem = memo(function TaskListItem({
  task,
  onEdit,
  onDelete,
  onToggle,
  language,
}) {
  return (
    <li className="border rounded-md p-2.5 bg-[var(--color-bg-surface-soft)] flex items-start gap-2">
      <IconButton
        icon="fa-solid fa-pen"
        label={t("dailyTasks.editTask", language)}
        onClick={() => onEdit(task)}
      />
      <IconButton
        icon="fa-solid fa-trash"
        label={t("dailyTasks.deleteTask", language)}
        className="bg-[var(--color-danger-soft)] border border-[var(--color-danger-border)] text-[var(--color-danger)]"
        onClick={() => onDelete(task)}
      />
      <Checkbox
        checked={task.is_done}
        onChange={() => onToggle(task)}
        title={
          task.is_done
            ? t("dailyTasks.markUndone", language)
            : t("dailyTasks.markDone", language)
        }
      />
      <span
        className={`text-[var(--color-text-primary)] flex-1 min-w-0 whitespace-normal break-words leading-6 ${task.is_done ? "line-through text-[var(--color-text-muted)]" : ""}`.trim()}
      >
        {task.content}
      </span>
      {task.alarm_enabled && task.alarm_time ? (
        <span
          className="inline-flex items-center gap-[5px] ms-auto text-[var(--color-text-secondary)] text-[0.8rem] whitespace-nowrap"
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
      actions={
        <Button icon="fa-solid fa-plus" onClick={onOpenAddTaskModal}>
          {t("dailyTasks.add", language)}
        </Button>
      }
    >
      <DatePicker
        className="mb-3"
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

      <p className="text-[var(--color-text-secondary)] m-0 text-[0.92rem]">
        {t("dailyTasks.selectedDate", language)}:{" "}
        {formatDateParts(tasksDate, language, calendarType).day}{" "}
        {formatMonthYear(tasksDate, language, calendarType)}
      </p>

      {tasksLoading ? (
        <p className="text-muted">{t("dailyTasks.loading", language)}</p>
      ) : null}

      {!tasksLoading && !tasks.length ? (
        <p className="mt-3 border rounded-md p-3 text-center text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-soft)]">
          {t("dailyTasks.noTasks", language)}
        </p>
      ) : null}

      <ul className="mt-2 space-y-2">
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
