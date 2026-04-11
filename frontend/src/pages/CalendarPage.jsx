import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import { api } from "../lib/api";
import {
  formatPersianDateParts,
  formatPersianMonthYear,
  getCurrentMonthISO,
  getMonthDaysGregorian,
} from "../lib/date";

function getNextStatus(current) {
  if (current === "done") return "missed";
  if (current === "missed") return "done";
  return "done";
}

export default function CalendarPage() {
  const [month, setMonth] = useState(getCurrentMonthISO());
  const [routines, setRoutines] = useState([]);
  const [logsMap, setLogsMap] = useState(new Map());
  const [error, setError] = useState("");

  const days = useMemo(() => getMonthDaysGregorian(month), [month]);

  async function load() {
    try {
      setError("");
      const startDate = days[0];
      const endDate = days[days.length - 1];

      const [routineData, logs] = await Promise.all([
        api.getRoutines(),
        api.getLogs(`?startDate=${startDate}&endDate=${endDate}`),
      ]);

      const nextMap = new Map();
      logs.forEach((item) =>
        nextMap.set(`${item.routine_id}-${item.date}`, item.status),
      );

      setRoutines(routineData);
      setLogsMap(nextMap);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [month]);

  async function toggleStatus(routineId, date) {
    try {
      const key = `${routineId}-${date}`;
      const next = getNextStatus(logsMap.get(key));
      await api.upsertLog({ routine_id: routineId, date, status: next });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell title="تقویم">
      <Card
        title="تقویم ماهانه"
        subtitle={`نمایش فارسی: ${formatPersianMonthYear(days[0])}`}
      >
        <div className="row compact">
          <label htmlFor="monthInput">ماه (برای API):</label>
          <input
            id="monthInput"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="inline-input month-input"
          />
        </div>
        {error ? <p className="error-text">{error}</p> : null}

        <div className="calendar-wrap">
          <table className="calendar-table">
            <thead>
              <tr>
                <th>روتین</th>
                {days.map((d) => {
                  const p = formatPersianDateParts(d);
                  return (
                    <th key={d} title={p.weekdayLong}>
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
                  <td colSpan={days.length + 1}>روتینی یافت نشد.</td>
                </tr>
              ) : (
                routines.map((routine) => (
                  <tr key={routine.id}>
                    <td className="routine-title-cell">{routine.title}</td>
                    {days.map((day) => {
                      const key = `${routine.id}-${day}`;
                      const status = logsMap.get(key);
                      const cls =
                        status === "done"
                          ? "status-btn done"
                          : status === "missed"
                            ? "status-btn missed"
                            : "status-btn";
                      return (
                        <td key={key}>
                          <button
                            className={cls}
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
      </Card>
    </AppShell>
  );
}
