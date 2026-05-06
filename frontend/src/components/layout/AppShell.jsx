import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getUser, setSession } from "../../lib/api";
import { useSettings } from "../../lib/settings";
import DatePicker from "../ui/DatePicker";
import Input from "../ui/Input";
import {
  formatDateParts,
  formatMonthYear,
  getMonthCursorFromISO,
  getTodayISO,
  shiftMonthCursor,
} from "../../lib/date";
import { t } from "../../lib/i18n";
import Header from "./Header";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import {
  CONFETTI_MODE_OPTIONS,
  getSavedConfettiSettings,
  setConfettiSettings,
} from "../../lib/confetti";
import { PAGE_TRANSITION_MODE_OPTIONS } from "../../lib/pageTransition";

const SELECT_BASE_CLASSES = [
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
  "bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)]",
  "focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)]",
  "focus:border-[var(--color-primary)]",
].join(" ");

export default function AppShell({ title, children }) {
  const initialUser = getUser();
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileName, setProfileName] = useState(initialUser?.name || "");
  const [profileDob, setProfileDob] = useState(
    initialUser?.date_of_birth || "",
  );
  const [profileDobMonth, setProfileDobMonth] = useState(() =>
    getMonthCursorFromISO(
      initialUser?.date_of_birth || getTodayISO(),
      initialUser?.calendar_type || "jalali",
    ),
  );
  const [isDobModalOpen, setIsDobModalOpen] = useState(false);
  const [profileCalendarType, setProfileCalendarType] = useState(
    initialUser?.calendar_type || "jalali",
  );
  const [profileGender, setProfileGender] = useState(initialUser?.gender || "");
  const [confettiSettings, setConfettiSettingsState] = useState(() =>
    getSavedConfettiSettings(),
  );
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const profileFileInputRef = useRef(null);
  const {
    theme,
    language,
    setTheme,
    setLanguage,
    setCalendarType,
    pageTransitionSettings,
    setPageTransitionSettings,
  } = useSettings();

  function openProfile() {
    setProfileMessage({ type: "", text: "" });
    setProfileName(user?.name || "");
    setProfileDob(user?.date_of_birth || "");
    setProfileDobMonth(
      getMonthCursorFromISO(
        user?.date_of_birth || getTodayISO(),
        user?.calendar_type || "jalali",
      ),
    );
    setProfileCalendarType(user?.calendar_type || "jalali");
    setProfileGender(user?.gender || "");
    setIsDobModalOpen(false);
    setIsProfileOpen(true);
    syncProfile();
  }

  function closeProfile() {
    setIsProfileOpen(false);
    setIsDobModalOpen(false);
    setProfileMessage({ type: "", text: "" });
  }

  function openSettings() {
    setConfettiSettingsState(getSavedConfettiSettings());
    setIsSettingsOpen(true);
  }

  function updatePageTransitionSettings(next) {
    setPageTransitionSettings((prev) => ({ ...prev, ...next }));
  }

  function openPasswordModal() {
    setPasswordMessage({ type: "", text: "" });
    setPasswordForm({ current: "", next: "", confirm: "" });
    setPasswordVisibility({ current: false, next: false, confirm: false });
    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setPasswordMessage({ type: "", text: "" });
    setPasswordForm({ current: "", next: "", confirm: "" });
    setPasswordVisibility({ current: false, next: false, confirm: false });
  }

  function togglePasswordVisibility(field) {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function updateConfettiSettings(next) {
    setConfettiSettingsState((prev) => {
      const merged = { ...prev, ...next };
      setConfettiSettings(merged);
      return merged;
    });
  }

  async function syncProfile() {
    try {
      setProfileLoading(true);
      const profile = await api.getProfile();
      const merged = { ...(getUser() || {}), ...profile };
      setUser(merged);
      setProfileName(merged?.name || "");
      setProfileDob(merged?.date_of_birth || "");
      setProfileDobMonth(
        getMonthCursorFromISO(
          merged?.date_of_birth || getTodayISO(),
          merged?.calendar_type || "jalali",
        ),
      );
      setProfileCalendarType(merged?.calendar_type || "jalali");
      setProfileGender(merged?.gender || "");
      setCalendarType(merged?.calendar_type || "jalali");
      const token = localStorage.getItem("dr_token");
      if (token) setSession(token, merged);
    } catch {
      setProfileMessage({
        type: "error",
        text: t("appShell.loadingProfileError", language),
      });
    } finally {
      setProfileLoading(false);
    }
  }

  function onAvatarClick() {
    profileFileInputRef.current?.click();
  }

  async function onSelectProfileImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      try {
        setProfileLoading(true);
        const updatedUser = await api.updateProfile({ profile_image: value });
        setUser(updatedUser);
        setCalendarType(updatedUser?.calendar_type || "jalali");
        const token = localStorage.getItem("dr_token");
        if (token) setSession(token, updatedUser);
        setProfileMessage({
          type: "success",
          text: t("appShell.profileImageSaved", language),
        });
      } catch (error) {
        setProfileMessage({
          type: "error",
          text: error.message || t("appShell.profileImageSaveError", language),
        });
      } finally {
        setProfileLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function submitProfile(event) {
    event.preventDefault();
    const nextName = profileName.trim();
    if (!nextName) {
      setProfileMessage({
        type: "error",
        text: t("appShell.usernameRequired", language),
      });
      return;
    }
    try {
      setProfileLoading(true);
      const updatedUser = await api.updateProfile({
        name: nextName,
        date_of_birth: profileDob || null,
        calendar_type: profileCalendarType,
        gender: profileGender || null,
      });
      setUser(updatedUser);
      setProfileName(updatedUser?.name || nextName);
      setProfileDob(updatedUser?.date_of_birth || "");
      setProfileCalendarType(updatedUser?.calendar_type || "jalali");
      setProfileGender(updatedUser?.gender || "");
      setCalendarType(updatedUser?.calendar_type || "jalali");
      const token = localStorage.getItem("dr_token");
      if (token) setSession(token, updatedUser);
      setProfileMessage({
        type: "success",
        text: t("appShell.profileSaved", language),
      });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error.message || t("appShell.profileSaveError", language),
      });
    } finally {
      setProfileLoading(false);
    }
  }

  async function submitPasswordChange(event) {
    event.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordMessage({
        type: "error",
        text: t("appShell.fillPasswordFields", language),
      });
      return;
    }
    if (passwordForm.next.length < 6) {
      setPasswordMessage({
        type: "error",
        text: t("appShell.passwordLengthError", language),
      });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({
        type: "error",
        text: t("appShell.passwordMismatch", language),
      });
      return;
    }
    try {
      setPasswordLoading(true);
      await api.changePassword({
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      setPasswordMessage({
        type: "success",
        text: t("appShell.passwordChangeSuccess", language),
      });
      setTimeout(() => closePasswordModal(), 800);
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error.message || t("appShell.passwordChangeError", language),
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!isProfileOpen) return;
    setProfileDobMonth(
      getMonthCursorFromISO(profileDob || getTodayISO(), profileCalendarType),
    );
  }, [profileCalendarType, isProfileOpen]);

  function handleSelectDob(isoDate) {
    setProfileDob(isoDate);
    setProfileDobMonth(getMonthCursorFromISO(isoDate, profileCalendarType));
    setIsDobModalOpen(false);
  }

  function toggleDobPicker(event) {
    event?.preventDefault?.();
    setIsDobModalOpen((prev) => !prev);
  }

  const profileDobPreview = profileDob
    ? `${formatDateParts(profileDob, language, profileCalendarType).day} ${formatMonthYear(profileDob, language, profileCalendarType)}`
    : "";

  const toggleBase = "relative w-11 h-6 inline-flex items-center";

  function PasswordField({ id, label, field }) {
    return (
      <div className="grid gap-1.5 w-full">
        <label
          htmlFor={id}
          className="text-[var(--color-text-secondary)] text-[0.9rem]"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            type={passwordVisibility[field] ? "text" : "password"}
            className={[
              "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
              "bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)] pl-[42px]",
              "focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)]",
              "focus:border-[var(--color-primary)]",
            ].join(" ")}
            value={passwordForm[field]}
            onChange={(event) =>
              setPasswordForm((prev) => ({
                ...prev,
                [field]: event.target.value,
              }))
            }
          />
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] text-[var(--color-secondary)] w-7 h-7 rounded-[8px] cursor-pointer inline-flex items-center justify-center text-[0.9rem]"
            onClick={() => togglePasswordVisibility(field)}
            title={
              passwordVisibility[field]
                ? t("appShell.hidePassword", language)
                : t("appShell.showPassword", language)
            }
          >
            <i
              className={
                passwordVisibility[field]
                  ? "fa-solid fa-eye-slash leading-none pointer-events-none"
                  : "fa-solid fa-eye leading-none pointer-events-none"
              }
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[var(--page-max-width)] mx-auto p-5 grid gap-2 max-[720px]:p-3 max-[720px]:gap-2"
      dir={language === "fa" ? "rtl" : "ltr"}
    >
      <Header
        title={title}
        user={user}
        theme={theme}
        language={language}
        onOpenProfile={openProfile}
        onOpenSettings={openSettings}
        onLogout={logout}
      />
      <main className="flex flex-col gap-2">{children}</main>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileOpen}
        onClose={closeProfile}
        title={t("appShell.profileModalTitle", language)}
        className="w-full max-w-[520px]"
      >
        <div className="flex flex-col items-center gap-3 mb-3">
          <div>
            <button
              className="border-0 bg-transparent cursor-pointer"
              onClick={onAvatarClick}
              title={t("appShell.changeProfileImage", language)}
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={t("appShell.profileImageAlt", language)}
                  className="w-[120px] h-[120px] rounded-full border border-[var(--color-border-default)] object-cover"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full border border-[var(--color-border-default)] grid place-items-center font-bold text-[var(--color-secondary)] bg-[var(--color-primary-soft)] text-[1.2rem]">
                  {(user?.name || t("common.userFallback", language)).slice(0, 1)}
                </div>
              )}
            </button>
            <input
              ref={profileFileInputRef}
              id="profileImage"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectProfileImage}
            />
          </div>

          <form
            className="flex flex-col w-[85%] gap-2"
            onSubmit={submitProfile}
          >
            <Input
              id="profileName"
              label={t("appShell.username", language)}
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />

            <Input
              id="profileDob"
              label={t("appShell.dateOfBirth", language)}
              type="text"
              value={profileDobPreview}
              placeholder={t("appShell.dateOfBirthPlaceholder", language)}
              readOnly
              style={{ cursor: "pointer" }}
              onMouseDown={toggleDobPicker}
            />

            <div className="flex gap-[10px]">
              <div className="grid gap-1.5 w-full">
                <label
                  htmlFor="profileGender"
                  className="text-[var(--color-text-secondary)] text-[0.9rem]"
                >
                  {t("appShell.gender", language)}
                </label>
                <select
                  id="profileGender"
                  className={SELECT_BASE_CLASSES}
                  value={profileGender}
                  onChange={(event) => setProfileGender(event.target.value)}
                >
                  <option value="">{t("appShell.gender", language)}</option>
                  <option value="male">{t("appShell.genderMale", language)}</option>
                  <option value="female">{t("appShell.genderFemale", language)}</option>
                  <option value="other">{t("appShell.genderOther", language)}</option>
                </select>
              </div>
              <div className="grid gap-1.5 w-full">
                <label
                  htmlFor="profileCalendarType"
                  className="text-[var(--color-text-secondary)] text-[0.9rem]"
                >
                  {t("appShell.calendarType", language)}
                </label>
                <select
                  id="profileCalendarType"
                  className={SELECT_BASE_CLASSES}
                  value={profileCalendarType}
                  onChange={(event) => setProfileCalendarType(event.target.value)}
                >
                  <option value="jalali">{t("appShell.calendarJalali", language)}</option>
                  <option value="gregorian">{t("appShell.calendarGregorian", language)}</option>
                </select>
              </div>
            </div>

            <Input
              id="profilePhone"
              label={t("appShell.phone", language)}
              value={user?.phone || ""}
              disabled
              readOnly
            />

            <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
              <Button type="submit" disabled={profileLoading}>
                {profileLoading
                  ? t("appShell.saving", language)
                  : t("appShell.saveProfile", language)}
              </Button>
            </div>
          </form>
        </div>

        {profileMessage.text ? (
          <p
            className={
              profileMessage.type === "error"
                ? "my-1.5 text-[var(--color-danger)] text-[0.9rem]"
                : "my-1.5 text-[var(--color-success)] text-[0.9rem]"
            }
          >
            {profileMessage.text}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
          <Button type="button" onClick={openPasswordModal}>
            {t("appShell.changePassword", language)}
          </Button>
          <Button type="button" variant="secondary" onClick={closeProfile}>
            {t("common.close", language)}
          </Button>
        </div>
        {profileLoading ? (
          <p className="text-[var(--color-text-muted)]">
            {t("appShell.updatingProfile", language)}
          </p>
        ) : null}
      </Modal>

      {/* DOB Modal */}
      <Modal
        isOpen={isDobModalOpen}
        onClose={() => setIsDobModalOpen(false)}
        title={t("appShell.dateOfBirth", language)}
      >
        <DatePicker
          month={profileDobMonth}
          calendarType={profileCalendarType}
          showMonthSwitchButtons={false}
          onPrevMonth={() =>
            setProfileDobMonth((prev) => shiftMonthCursor(prev, -1))
          }
          onNextMonth={() =>
            setProfileDobMonth((prev) => shiftMonthCursor(prev, 1))
          }
          onSetMonth={setProfileDobMonth}
          onGoToday={() =>
            setProfileDobMonth(
              getMonthCursorFromISO(getTodayISO(), profileCalendarType),
            )
          }
          selectedDate={profileDob || undefined}
          onSelectDay={handleSelectDob}
          language={language}
        />
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={t("login.settingsTitle", language)}
        className="w-full max-w-[520px]"
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
            <ThemeSwitcher
              label={t("login.theme", language)}
              value={theme}
              onChange={setTheme}
            />
            <LanguageSwitcher
              label={t("login.language", language)}
              value={language}
              onChange={setLanguage}
            />
          </div>

          {/* Confetti settings */}
          <div className="flex flex-col gap-2 border border-[var(--color-border-default)] rounded-[var(--radius-md)] p-2.5">
            <div className="flex items-center justify-between gap-2 text-[var(--color-text-secondary)] text-[0.9rem]">
              <span>{t("confetti.enable", language)}</span>
              <label className={toggleBase}>
                <input
                  type="checkbox"
                  className="opacity-0 w-0 h-0"
                  checked={confettiSettings.enabled}
                  onChange={(event) =>
                    updateConfettiSettings({ enabled: event.target.checked })
                  }
                />
                <span
                  className="absolute inset-0 rounded-full transition-[background] duration-200 before:content-[''] before:absolute before:top-[3px] before:w-[18px] before:h-[18px] before:rounded-full before:bg-[var(--color-bg-surface)] before:transition-all before:duration-200"
                  style={{
                    background: confettiSettings.enabled
                      ? "color-mix(in srgb, var(--color-primary) 60%, transparent)"
                      : "color-mix(in srgb, var(--color-text-muted) 20%, transparent)",
                  }}
                />
              </label>
            </div>
            <div className="grid gap-1.5 w-full">
              <label
                htmlFor="confettiMode"
                className="text-[var(--color-text-secondary)] text-[0.9rem]"
              >
                {t("confetti.mode", language)}
              </label>
              <div className="relative">
                <select
                  id="confettiMode"
                  className={`${SELECT_BASE_CLASSES} appearance-none [padding-inline-end:36px]`}
                  value={confettiSettings.mode}
                  onChange={(event) =>
                    updateConfettiSettings({ mode: event.target.value })
                  }
                  disabled={!confettiSettings.enabled}
                >
                  {CONFETTI_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`confetti.modes.${option.value}`, language)}
                    </option>
                  ))}
                </select>
                <i
                  className="fa-solid fa-chevron-down absolute text-[var(--color-text-secondary)] pointer-events-none text-[0.82rem] [inset-inline-end:12px] top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Page transition settings */}
          <div className="flex flex-col gap-2 border border-[var(--color-border-default)] rounded-[var(--radius-md)] p-2.5">
            <div className="flex items-center justify-between gap-2 text-[var(--color-text-secondary)] text-[0.9rem]">
              <span>{t("pageTransition.enable", language)}</span>
              <label className={toggleBase}>
                <input
                  type="checkbox"
                  className="opacity-0 w-0 h-0"
                  checked={pageTransitionSettings.enabled}
                  onChange={(event) =>
                    updatePageTransitionSettings({
                      enabled: event.target.checked,
                    })
                  }
                />
                <span
                  className="absolute inset-0 rounded-full transition-[background] duration-200 before:content-[''] before:absolute before:top-[3px] before:w-[18px] before:h-[18px] before:rounded-full before:bg-[var(--color-bg-surface)] before:transition-all before:duration-200"
                  style={{
                    background: pageTransitionSettings.enabled
                      ? "color-mix(in srgb, var(--color-primary) 60%, transparent)"
                      : "color-mix(in srgb, var(--color-text-muted) 20%, transparent)",
                  }}
                />
              </label>
            </div>
            <div className="grid gap-1.5 w-full">
              <label
                htmlFor="pageTransitionMode"
                className="text-[var(--color-text-secondary)] text-[0.9rem]"
              >
                {t("pageTransition.mode", language)}
              </label>
              <div className="relative">
                <select
                  id="pageTransitionMode"
                  className={`${SELECT_BASE_CLASSES} appearance-none [padding-inline-end:36px]`}
                  value={pageTransitionSettings.mode}
                  onChange={(event) =>
                    updatePageTransitionSettings({ mode: event.target.value })
                  }
                  disabled={!pageTransitionSettings.enabled}
                >
                  {PAGE_TRANSITION_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`pageTransition.modes.${option.value}`, language)}
                    </option>
                  ))}
                </select>
                <i
                  className="fa-solid fa-chevron-down absolute text-[var(--color-text-secondary)] pointer-events-none text-[0.82rem] [inset-inline-end:12px] top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSettingsOpen(false)}
            >
              {t("common.close", language)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title={t("appShell.passwordModalTitle", language)}
      >
        <form className="grid gap-2.5" onSubmit={submitPasswordChange}>
          <PasswordField
            id="currentPassword"
            label={t("appShell.currentPassword", language)}
            field="current"
          />
          <PasswordField
            id="nextPassword"
            label={t("appShell.newPassword", language)}
            field="next"
          />
          <PasswordField
            id="confirmPassword"
            label={t("appShell.confirmPassword", language)}
            field="confirm"
          />

          {passwordMessage.text ? (
            <p
              className={
                passwordMessage.type === "error"
                  ? "my-1.5 text-[var(--color-danger)] text-[0.9rem]"
                  : "my-1.5 text-[var(--color-success)] text-[0.9rem]"
              }
            >
              {passwordMessage.text}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
            <Button
              type="button"
              variant="secondary"
              onClick={closePasswordModal}
            >
              {t("common.cancel", language)}
            </Button>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading
                ? t("appShell.saving", language)
                : t("appShell.savePassword", language)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
