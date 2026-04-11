import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api, setSession, getToken } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getToken()) {
    navigate("/", { replace: true });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        mode === "register"
          ? {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
            }
          : { email: form.email.trim(), password: form.password };

      const result =
        mode === "register"
          ? await api.register(payload)
          : await api.login(payload);
      setSession(result.token, result.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page" dir="rtl">
      <Card
        title={mode === "register" ? "ایجاد حساب" : "ورود به حساب"}
        subtitle="مدیریت روتین‌های روزانه با تقویم فارسی"
      >
        <form className="stack" onSubmit={submit}>
          {mode === "register" ? (
            <Input
              id="name"
              label="نام"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          ) : null}

          <Input
            id="email"
            type="email"
            label="ایمیل"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />

          <Input
            id="password"
            type="password"
            label="رمز عبور"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />

          {error ? <p className="error-text">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading
              ? "در حال ارسال..."
              : mode === "register"
                ? "ثبت‌نام"
                : "ورود"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setMode((prev) => (prev === "login" ? "register" : "login"))
            }
          >
            {mode === "register" ? "حساب دارید؟ ورود" : "حساب ندارید؟ ثبت‌نام"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
