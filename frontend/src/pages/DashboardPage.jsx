import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { api } from "../lib/api";

export default function DashboardPage() {
  const [newTitle, setNewTitle] = useState("");
  const [routines, setRoutines] = useState([]);
  const [editing, setEditing] = useState({});
  const [error, setError] = useState("");

  async function loadRoutines() {
    try {
      setError("");
      const data = await api.getRoutines();
      setRoutines(data);
      setEditing(Object.fromEntries(data.map((r) => [r.id, r.title])));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadRoutines();
  }, []);

  async function createRoutine(event) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createRoutine({ title: newTitle.trim() });
      setNewTitle("");
      await loadRoutines();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveRoutine(id) {
    const title = (editing[id] || "").trim();
    if (!title) {
      setError("عنوان روتین نمی‌تواند خالی باشد.");
      return;
    }

    try {
      await api.updateRoutine(id, { title });
      await loadRoutines();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeRoutine(id) {
    try {
      await api.deleteRoutine(id);
      await loadRoutines();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell title="داشبورد">
      <Card title="روتین جدید" subtitle="با یک عنوان کوتاه شروع کنید.">
        <form className="row" onSubmit={createRoutine}>
          <Input
            id="newTitle"
            placeholder="مثلاً پیاده‌روی ۲۰ دقیقه"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Button type="submit">افزودن</Button>
        </form>
      </Card>

      <Card title="روتین‌ها" subtitle="امکان ویرایش و حذف مستقیم از همین صفحه.">
        {error ? <p className="error-text">{error}</p> : null}
        {!routines.length ? (
          <p className="muted">هنوز روتینی ثبت نشده است.</p>
        ) : null}

        <div className="routine-list">
          {routines.map((routine) => (
            <div className="routine-item" key={routine.id}>
              <input
                className="inline-input"
                value={editing[routine.id] || ""}
                onChange={(e) =>
                  setEditing((prev) => ({
                    ...prev,
                    [routine.id]: e.target.value,
                  }))
                }
              />
              <div className="row-actions">
                <Button
                  variant="secondary"
                  onClick={() => saveRoutine(routine.id)}
                >
                  ذخیره
                </Button>
                <Button
                  variant="danger"
                  onClick={() => removeRoutine(routine.id)}
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
