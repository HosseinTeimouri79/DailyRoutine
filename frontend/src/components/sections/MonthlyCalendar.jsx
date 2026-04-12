import Card from "../ui/Card";
import Button from "../ui/Button";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";

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
                      "--routine-accent": routine.color || "#375dfb",
                    }
                  : undefined
              }
            >
              <span
                className="routine-color-dot"
                style={{
                  backgroundColor:
                    selectedRoutineId === routine.id
                      ? routine.color || "#9fb6ff"
                      : "#c8cfde",
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
