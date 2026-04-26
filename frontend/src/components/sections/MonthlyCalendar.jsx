import Card from "../ui/Card";
import ProgressRing from "../ui/ProgressRing";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { t } from "../../lib/i18n";
import "./MonthlyCalendar.css";

function SelectedRoutinePieReport({ data, language }) {
  if (!data)
    return <p className="muted">{t("dailyTasks.loading", language)}</p>;

  const done = data.done || 0;
  const missed = data.missed || 0;
  const remaining = data.remaining || 0;
  const total = done + missed + remaining;

  const segments = [
    {
      key: "done",
      label: t("monthly.done", language),
      value: done,
      fill: "var(--color-success-border)",
    },
    {
      key: "missed",
      label: t("monthly.missed", language),
      value: missed,
      fill: "var(--color-danger-border)",
    },
    {
      key: "remaining",
      label: t("monthly.remaining", language),
      value: remaining,
      fill: "color-mix(in srgb, var(--color-primary) 35%, var(--color-bg-surface))",
    },
  ];

  const chartData = segments.filter((segment) => segment.value > 0);
  const fallbackData = [
    {
      key: "empty",
      label: t("monthly.noData", language),
      value: 1,
      fill: "var(--border-default)",
    },
  ];
  const renderData = chartData.length ? chartData : fallbackData;
  const donePercent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="monthly-pie-report">
      <div className="monthly-pie-legend">
        {segments.map((segment) => (
          <div key={segment.key} className="monthly-pie-legend-item">
            <i
              className="monthly-pie-legend-dot"
              style={{ backgroundColor: segment.fill }}
            />
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
          </div>
        ))}
      </div>

      <div
        className="monthly-pie-wrap"
        role="img"
        aria-label={t("monthly.reportAriaLabel", language)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, _name, item) => [value, item.payload.label]}
              contentStyle={{
                borderRadius: "10px",
                border: "var(--border-default)",
                background: "var(--color-bg-surface)",
              }}
            />
            <Pie
              data={renderData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={43}
              outerRadius={63}
              paddingAngle={chartData.length ? 3 : 0}
              cornerRadius={10}
              stroke="none"
            >
              {renderData.map((segment) => (
                <Cell key={segment.key} fill={segment.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="monthly-pie-center">
          <strong>
            {donePercent}
            {t("monthly.percentSymbol", language)}
          </strong>
          <span>{t("monthly.done", language)}</span>
        </div>
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
  monthlyRoutineReport,
  language,
}) {
  const routineStatsMap = new Map(
    (monthlyRoutineReport || []).map((item) => [item.id, item]),
  );
  const selectedRoutineStats = selectedRoutineId
    ? routineStatsMap.get(selectedRoutineId)
    : null;

  if (!routines.length) {
    return (
      <Card title={t("monthly.title", language)} subtitle={subtitle}>
        <p className="empty-state-message">
          {t("monthly.noRoutines", language)}
        </p>
      </Card>
    );
  }

  return (
    <Card title={t("monthly.title", language)} subtitle={subtitle}>
      <div className="monthly-calendar-overview">
        <div className="routine-badges">
          {routines.map((routine) => {
            const stats = routineStatsMap.get(routine.id);
            const totalDays =
              (stats?.done || 0) +
              (stats?.missed || 0) +
              (stats?.remaining || 0);
            const percent = totalDays
              ? Math.round(((stats?.done || 0) / totalDays) * 100)
              : 0;

            return (
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
                <ProgressRing
                  className="routine-month-progress"
                  percent={percent}
                  size={24}
                  innerSize={17}
                  title={t("monthly.monthProgressTitle", language, {
                    percent,
                  })}
                />
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
            );
          })}
        </div>
        <SelectedRoutinePieReport
          data={selectedRoutineStats || monthlyReport}
          language={language}
        />
      </div>

      <PersianMonthCalendar
        month={month}
        onPrevMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onGoToday={goToTodayMonthly}
        selectedDate={selectedMonthlyDate}
        onSelectDay={setSelectedMonthlyDate}
        getDayStatus={getSelectedRoutineDayStatus}
        language={language}
      />
    </Card>
  );
}
