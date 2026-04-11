import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import { api } from "../lib/api";
import { getCurrentMonthISO } from "../lib/date";

function StatGrid({ data }) {
  if (!data) return <p className="muted">در حال بارگذاری...</p>;

  return (
    <div className="stats-grid">
      <div>روتین‌ها: {data.routines}</div>
      <div>انجام‌شده: {data.done}</div>
      <div>از دست‌رفته: {data.missed}</div>
      <div>باقی‌مانده: {data.remaining}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [month, setMonth] = useState(getCurrentMonthISO());
  const [monthly, setMonthly] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const [m, w] = await Promise.all([
        api.getMonthlyReport(month),
        api.getWeeklyReport(),
      ]);
      setMonthly(m);
      setWeekly(w);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [month]);

  return (
    <AppShell title="گزارش‌ها">
      <Card title="بازه گزارش" subtitle="خلاصه هفتگی و ماهانه عادت‌ها">
        <div className="row compact">
          <label htmlFor="monthReport">ماه:</label>
          <input
            id="monthReport"
            type="month"
            className="inline-input month-input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </Card>

      <Card title="گزارش ماهانه">
        <StatGrid data={monthly} />
      </Card>

      <Card title="گزارش هفتگی">
        <StatGrid data={weekly} />
      </Card>
    </AppShell>
  );
}
