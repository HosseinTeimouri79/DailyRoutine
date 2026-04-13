import Card from "../ui/Card";
import Button from "../ui/Button";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";
import "./MonthlyCalendar.css";

function StatGrid({ data, action }) {
  if (!data) return <p className="muted">در حال بارگذاری...</p>;

  return (
    <div className="stats-flex">
      <div>
        <div className="task-info">انجام‌شده: {data.done}</div>
        <div className="task-info">انجام‌نشده: {data.missed}</div>
        <div className="task-info">ثبت‌نشده: {data.remaining}</div>
      </div>
      <div>
        <div className="task-info">روتین‌ها: {data.routines}</div>
        {action ? action : null}
      </div>
    </div>
  );
}

export default function MonthlyCalendar({
  subtitle,
  routines,
  selectedRoutineId,
  setSelectedRoutineId,
  month,
  goToPreviousMonth,
  goToNextMonth,
  goToTodayMonthly,
  selectedMonthlyDate,
  setSelectedMonthlyDate,
  getSelectedRoutineDayStatus,
  monthlyReport,
  onOpenMonthlyChart,
}) {
  return (
    <Card title="تقویم ماهانه" subtitle={subtitle}>
      <div className="routine-badges">
        {!routines.length ? (
          <p className="muted">ابتدا یک روتین تعریف کنید.</p>
        ) : (
          routines.map((routine) => (
            <button
              key={routine.id}
              className={`routine-badge ${selectedRoutineId === routine.id ? "active" : ""}`.trim()}
              onClick={() => setSelectedRoutineId(routine.id)}
              style={
                selectedRoutineId === routine.id
                  ? {
                      "--routine-accent":
                        routine.color || "var(--color-primary)",
                    }
                  : undefined
              }
            >
              <span
                className="routine-color-dot"
                style={{
                  backgroundColor:
                    selectedRoutineId === routine.id
                      ? routine.color || "var(--color-primary)"
                      : "var(--color-text-muted)",
                }}
              />
              {routine.title}
            </button>
          ))
        )}
      </div>

      <PersianMonthCalendar
        month={month}
        onPrevMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onGoToday={goToTodayMonthly}
        selectedDate={selectedMonthlyDate}
        onSelectDay={setSelectedMonthlyDate}
        getDayStatus={getSelectedRoutineDayStatus}
      />

      <StatGrid
        data={monthlyReport}
        action={
          <Button variant="secondary" onClick={onOpenMonthlyChart}>
            چارت گزارش ماهانه
          </Button>
        }
      />
    </Card>
  );
}
