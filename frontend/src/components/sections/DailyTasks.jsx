import Card from "../ui/Card";
import Button from "../ui/Button";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";
import {
  formatPersianDateParts,
  formatPersianMonthYear,
  shiftPersianMonth,
} from "../../lib/date";

export default function DailyTasks({
  tasksMonth,
  setTasksMonth,
  goToTodayTasks,
  tasksDate,
  setTasksDate,
  newTaskText,
  setNewTaskText,
  createTask,
  tasksLoading,
  tasks,
  toggleTaskDone,
  onRequestTaskDelete,
}) {
  return (
    <Card
      title="کارهای روزانه"
      subtitle="روز را از تقویم انتخاب کن و کارهای همان روز را مدیریت کن"
    >
      <PersianMonthCalendar
        className="daily-tasks-calendar"
        month={tasksMonth}
        onPrevMonth={() => setTasksMonth((prev) => shiftPersianMonth(prev, -1))}
        onNextMonth={() => setTasksMonth((prev) => shiftPersianMonth(prev, 1))}
        onGoToday={goToTodayTasks}
        selectedDate={tasksDate}
        onSelectDay={setTasksDate}
      />

      <div className="daily-tasks-toolbar">
        <p className="muted tasks-selected-date">
          تاریخ انتخاب‌شده: {formatPersianDateParts(tasksDate).day}{" "}
          {formatPersianMonthYear(tasksDate)}
        </p>
        <form className="daily-tasks-form" onSubmit={createTask}>
          <input
            className="input"
            placeholder="کار جدید برای این روز"
            value={newTaskText}
            onChange={(event) => setNewTaskText(event.target.value)}
          />
          <Button type="submit">افزودن</Button>
        </form>
      </div>

      {tasksLoading ? <p className="muted">در حال بارگذاری...</p> : null}

      {!tasksLoading && !tasks.length ? (
        <p className="muted">برای این روز هنوز کاری ثبت نشده است.</p>
      ) : null}

      <ul className="daily-tasks-list">
        {tasks.map((task) => (
          <li key={task.id} className="daily-task-item">
            <button
              className={`daily-task-check ${task.is_done ? "done" : ""}`.trim()}
              onClick={() => toggleTaskDone(task)}
              title={
                task.is_done
                  ? "علامت‌گذاری به‌عنوان ناتمام"
                  : "علامت‌گذاری به‌عنوان انجام‌شده"
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
            <button
              className="routine-icon-btn delete"
              onClick={() => onRequestTaskDelete(task)}
              title="حذف کار"
            >
              <i className="fa-solid fa-trash" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
