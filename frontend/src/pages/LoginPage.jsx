import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api, setSession, getToken } from "../lib/api";

const IRAN_PHONE_REGEX = /^(?:\+98|0)?9\d{9}$/;

function normalizeIranPhone(rawPhone) {
  let phone = (rawPhone || "").trim().replace(/\s+/g, "");
  if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith("98")) phone = `0${phone.slice(2)}`;
  else if (phone.startsWith("9")) phone = `0${phone}`;
  return phone;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
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
      const normalizedPhone = normalizeIranPhone(form.phone);
      if (!IRAN_PHONE_REGEX.test(normalizedPhone)) {
        throw new Error("شماره تلفن معتبر ایران وارد کنید.");
      }

      const payload =
        mode === "register"
          ? {
              name: form.name.trim(),
              phone: normalizedPhone,
              password: form.password,
            }
          : { phone: normalizedPhone, password: form.password };

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
            id="phone"
            type="tel"
            label="شماره تلفن"
            placeholder="مثال: 09123456789"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
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
