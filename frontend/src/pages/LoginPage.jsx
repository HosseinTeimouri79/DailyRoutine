import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ThemeSwitcher from "../components/ui/ThemeSwitcher";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import Dropdown from "../components/ui/Dropdown";
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
const INPUT_BASE_CLASSES = [
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
  "bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)]",
  "focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)]",
  "focus:border-[var(--color-primary)]",
  "disabled:bg-[color-mix(in_srgb,var(--color-bg-surface-soft)_82%,var(--color-bg-page))]",
  "disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
].join(" ");

const FIELD_CLASSES = "grid gap-1.5 w-full";
const FIELD_LABEL_CLASSES = "text-text-secondary text-[0.9rem]";

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
    <div
      className="min-h-screen grid place-items-center p-6"
      dir={language === "fa" ? "rtl" : "ltr"}
    >
      <Card
        title={
          mode === "register"
            ? t("login.titleRegister", language)
            : t("login.titleLogin", language)
        }
        subtitle={t("login.subtitle", language)}
      >
        <div className="flex flex-wrap gap-2.5 mb-4">
          <ThemeSwitcher
            className="min-w-[180px] flex-1"
            value={theme}
            onChange={setTheme}
            label={t("login.theme", language)}
          />

          <LanguageSwitcher
            className="min-w-[180px] flex-1"
            value={language}
            onChange={setLanguage}
            label={t("login.language", language)}
          />
        </div>

        <form className="grid gap-2.5" onSubmit={submit}>
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
              <div className={FIELD_CLASSES}>
                <label className={FIELD_LABEL_CLASSES} htmlFor="dateOfBirth">
                  {t("login.dateOfBirth", language)}
                </label>
                <input
                  id="dateOfBirth"
                  type="text"
                  className={INPUT_BASE_CLASSES}
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

              <div className="flex gap-2.5">
                <div className={FIELD_CLASSES}>
                  <label className={FIELD_LABEL_CLASSES} htmlFor="calendarType">
                    {t("login.calendarType", language)}
                  </label>
                  <Dropdown
                    id="calendarType"
                    className="w-full"
                    value={form.calendar_type}
                    onChange={(nextValue) =>
                      setForm((prev) => ({
                        ...prev,
                        calendar_type: nextValue,
                      }))
                    }
                    options={[
                      {
                        value: "jalali",
                        label: t("login.calendarJalali", language),
                      },
                      {
                        value: "gregorian",
                        label: t("login.calendarGregorian", language),
                      },
                    ]}
                  />
                </div>
                <div className={FIELD_CLASSES}>
                  <label className={FIELD_LABEL_CLASSES} htmlFor="gender">
                    {t("login.gender", language)}
                  </label>
                  <Dropdown
                    id="gender"
                    className="w-full"
                    value={form.gender}
                    onChange={(nextValue) =>
                      setForm((prev) => ({ ...prev, gender: nextValue }))
                    }
                    options={[
                      { value: "", label: t("login.gender", language) },
                      { value: "male", label: t("login.genderMale", language) },
                      {
                        value: "female",
                        label: t("login.genderFemale", language),
                      },
                      {
                        value: "other",
                        label: t("login.genderOther", language),
                      },
                    ]}
                  />
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

          <div className={FIELD_CLASSES}>
            <label className={FIELD_LABEL_CLASSES} htmlFor="password">
              {t("login.password", language)}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${INPUT_BASE_CLASSES} pl-[42px]`}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 border border-border-strong bg-primary-soft text-secondary w-7 h-7 rounded-[8px] cursor-pointer inline-flex items-center justify-center text-[0.9rem]"
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
                  className={`${showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} leading-none pointer-events-none`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {error ? (
            <p className="my-1.5 text-danger text-[0.9rem]">{error}</p>
          ) : null}

          <div className="flex justify-between flex-wrap gap-2.5">
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
