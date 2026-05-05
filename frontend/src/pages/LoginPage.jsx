import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ThemeSwitcher from "../components/ui/ThemeSwitcher";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import Modal from "../components/ui/Modal";
import DatePicker from "../components/ui/DatePicker";
import { api, setSession, getToken } from "../lib/api";
import { useSettings } from "../lib/settings";
import {
  formatDateParts,
  formatMonthYear,
  getMonthCursorFromISO,
  getTodayISO,
  shiftMonthCursor,
} from "../lib/date";
import { t } from "../lib/i18n";
import "./LoginPage.css";

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
  const { theme, language, setTheme, setLanguage, setCalendarType } =
    useSettings();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    date_of_birth: "",
    calendar_type: "jalali",
    gender: "",
  });
  const [registerDobMonth, setRegisterDobMonth] = useState(() =>
    getMonthCursorFromISO(getTodayISO(), "jalali"),
  );
  const [isRegisterDobModalOpen, setIsRegisterDobModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleRegisterDobPicker(event) {
    event?.preventDefault?.();
    setIsRegisterDobModalOpen((prev) => !prev);
  }

  useEffect(() => {
    if (mode !== "register") return;
    setRegisterDobMonth(
      getMonthCursorFromISO(
        form.date_of_birth || getTodayISO(),
        form.calendar_type,
      ),
    );
  }, [mode, form.calendar_type, form.date_of_birth]);

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
        throw new Error(t("login.invalidPhone", language));
      }

      const payload =
        mode === "register"
          ? {
              name: form.name.trim(),
              phone: normalizedPhone,
              password: form.password,
              date_of_birth: form.date_of_birth || null,
              calendar_type: form.calendar_type,
              gender: form.gender || null,
            }
          : { phone: normalizedPhone, password: form.password };

      const result =
        mode === "register"
          ? await api.register(payload)
          : await api.login(payload);
      setSession(result.token, result.user);
      setCalendarType(result?.user?.calendar_type || "jalali");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page" dir={language === "fa" ? "rtl" : "ltr"}>
      <Card
        title={
          mode === "register"
            ? t("login.titleRegister", language)
            : t("login.titleLogin", language)
        }
        subtitle={t("login.subtitle", language)}
      >
        <div className="auth-settings-row">
          <ThemeSwitcher
            className="auth-theme-switcher"
            value={theme}
            onChange={setTheme}
            label={t("login.theme", language)}
          />

          <LanguageSwitcher
            className="auth-language-switcher"
            value={language}
            onChange={setLanguage}
            label={t("login.language", language)}
          />
        </div>

        <form className="stack" onSubmit={submit}>
          {mode === "register" ? (
            <>
              <Input
                id="name"
                label={t("login.name", language)}
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <div className="field">
                <label htmlFor="dateOfBirth">
                  {t("login.dateOfBirth", language)}
                </label>
                <input
                  id="dateOfBirth"
                  type="text"
                  className="input"
                  value={
                    form.date_of_birth
                      ? `${formatDateParts(form.date_of_birth, language, form.calendar_type).day} ${formatMonthYear(form.date_of_birth, language, form.calendar_type)}`
                      : ""
                  }
                  placeholder={t("login.dateOfBirthPlaceholder", language)}
                  readOnly
                  onMouseDown={toggleRegisterDobPicker}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <div className="field">
                  <label htmlFor="calendarType">
                    {t("login.calendarType", language)}
                  </label>
                  <select
                    id="calendarType"
                    className="input"
                    value={form.calendar_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        calendar_type: e.target.value,
                      }))
                    }
                  >
                    <option value="jalali">
                      {t("login.calendarJalali", language)}
                    </option>
                    <option value="gregorian">
                      {t("login.calendarGregorian", language)}
                    </option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="gender">{t("login.gender", language)}</label>
                  <select
                    id="gender"
                    className="input"
                    value={form.gender}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, gender: e.target.value }))
                    }
                  >
                    <option value="">{t("login.gender", language)}</option>
                    <option value="male">
                      {t("login.genderMale", language)}
                    </option>
                    <option value="female">
                      {t("login.genderFemale", language)}
                    </option>
                    <option value="other">
                      {t("login.genderOther", language)}
                    </option>
                  </select>
                </div>
              </div>
            </>
          ) : null}

          <Input
            id="phone"
            type="tel"
            label={t("login.phone", language)}
            placeholder={t("login.phonePlaceholder", language)}
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            required
          />

          <div className="field">
            <label htmlFor="password">{t("login.password", language)}</label>
            <div className="password-input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input password-input"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={
                  showPassword
                    ? t("login.hidePassword", language)
                    : t("login.showPassword", language)
                }
                aria-label={
                  showPassword
                    ? t("login.hidePassword", language)
                    : t("login.showPassword", language)
                }
              >
                <i
                  className={
                    showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                  }
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="login-actions">
            <Button type="submit" disabled={loading}>
              {loading
                ? t("appShell.saving", language)
                : mode === "register"
                  ? t("login.submitRegister", language)
                  : t("login.submitLogin", language)}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setMode((prev) => (prev === "login" ? "register" : "login"))
              }
            >
              {mode === "register"
                ? t("login.haveAccount", language)
                : t("login.noAccount", language)}
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        isOpen={isRegisterDobModalOpen}
        onClose={() => setIsRegisterDobModalOpen(false)}
        title={t("login.dateOfBirth", language)}
      >
        <DatePicker
          className="auth-dob-calendar"
          month={registerDobMonth}
          calendarType={form.calendar_type}
          showMonthSwitchButtons={false}
          onSetMonth={setRegisterDobMonth}
          selectedDate={form.date_of_birth || undefined}
          onSelectDay={(isoDate) => {
            setForm((prev) => ({
              ...prev,
              date_of_birth: isoDate,
            }));
            setRegisterDobMonth(
              getMonthCursorFromISO(isoDate, form.calendar_type),
            );
            setIsRegisterDobModalOpen(false);
          }}
          language={language}
        />
      </Modal>
    </div>
  );
}
