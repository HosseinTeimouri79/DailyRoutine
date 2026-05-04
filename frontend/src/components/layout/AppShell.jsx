import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getUser, setSession } from "../../lib/api";
import { useSettings } from "../../lib/settings";
import PersianMonthCalendar from "../calendar/PersianMonthCalendar";
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
import "./AppShell.css";

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
    setPageTransitionSettings((prev) => ({
      ...prev,
      ...next,
    }));
  }

  function closeSettings() {
    setIsSettingsOpen(false);
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
      const merged = {
        ...prev,
        ...next,
      };
      setConfettiSettings(merged);
      return merged;
    });
  }

  async function syncProfile() {
    try {
      setProfileLoading(true);
      const profile = await api.getProfile();
      const merged = {
        ...(getUser() || {}),
        ...profile,
      };
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
      setTimeout(() => {
        closePasswordModal();
      }, 800);
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
  const profileDobInputDisplay = profileDobPreview || "";

  return (
    <div className="app-shell" dir={language === "fa" ? "rtl" : "ltr"}>
      <Header
        title={title}
        user={user}
        theme={theme}
        language={language}
        onOpenProfile={openProfile}
        onOpenSettings={openSettings}
        onLogout={logout}
      />

      <main className="content-grid">{children}</main>

      <Modal
        isOpen={isProfileOpen}
        onClose={closeProfile}
        title={t("appShell.profileModalTitle", language)}
        className="profile-modal"
      >
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            <button
              className="profile-avatar-btn"
              onClick={onAvatarClick}
              title={t("appShell.changeProfileImage", language)}
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={t("appShell.profileImageAlt", language)}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {(user?.name || t("common.userFallback", language)).slice(
                    0,
                    1,
                  )}
                </div>
              )}
            </button>
            <input
              ref={profileFileInputRef}
              id="profileImage"
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={onSelectProfileImage}
            />
          </div>
          <form className="profile-meta" onSubmit={submitProfile}>
            <div className="field">
              <label htmlFor="profileName">
                {t("appShell.username", language)}
              </label>
              <input
                id="profileName"
                className="input"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="profileDob">
                {t("appShell.dateOfBirth", language)}
              </label>
              <div className="profile-dob-trigger-row">
                <input
                  id="profileDob"
                  type="text"
                  className="input"
                  value={profileDobInputDisplay}
                  placeholder={t("appShell.dateOfBirthPlaceholder", language)}
                  readOnly
                  onMouseDown={toggleDobPicker}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <div className="field">
                <label htmlFor="profileGender">
                  {t("appShell.gender", language)}
                </label>
                <select
                  id="profileGender"
                  className="input"
                  value={profileGender}
                  onChange={(event) => setProfileGender(event.target.value)}
                >
                  <option value="">{t("appShell.gender", language)}</option>
                  <option value="male">
                    {t("appShell.genderMale", language)}
                  </option>
                  <option value="female">
                    {t("appShell.genderFemale", language)}
                  </option>
                  <option value="other">
                    {t("appShell.genderOther", language)}
                  </option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="profileCalendarType">
                  {t("appShell.calendarType", language)}
                </label>
                <select
                  id="profileCalendarType"
                  className="input"
                  value={profileCalendarType}
                  onChange={(event) =>
                    setProfileCalendarType(event.target.value)
                  }
                >
                  <option value="jalali">
                    {t("appShell.calendarJalali", language)}
                  </option>
                  <option value="gregorian">
                    {t("appShell.calendarGregorian", language)}
                  </option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="profilePhone">
                {t("appShell.phone", language)}
              </label>
              <input
                id="profilePhone"
                className="input"
                value={user?.phone || ""}
                disabled
                readOnly
              />
            </div>
            <div className="modal-actions">
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
              profileMessage.type === "error" ? "error-text" : "success-text"
            }
          >
            {profileMessage.text}
          </p>
        ) : null}

        <div className="modal-actions">
          <Button type="button" onClick={openPasswordModal}>
            {t("appShell.changePassword", language)}
          </Button>
          <Button type="button" variant="secondary" onClick={closeProfile}>
            {t("common.close", language)}
          </Button>
        </div>
        {profileLoading ? (
          <p className="muted">{t("appShell.updatingProfile", language)}</p>
        ) : null}
      </Modal>

      <Modal
        isOpen={isDobModalOpen}
        onClose={() => setIsDobModalOpen(false)}
        title={t("appShell.dateOfBirth", language)}
      >
        <PersianMonthCalendar
          className="profile-dob-calendar"
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

      <Modal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        title={t("login.settingsTitle", language)}
        className="settings-modal"
      >
        <div className="settings-stack">
          <div className="profile-settings-grid">
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
          <div className="setting-box">
            <div className="profile-toggle-row">
              <span>{t("confetti.enable", language)}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={confettiSettings.enabled}
                  onChange={(event) =>
                    updateConfettiSettings({
                      enabled: event.target.checked,
                    })
                  }
                />
                <span className="toggle-slider" aria-hidden="true" />
              </label>
            </div>
            <div className="field">
              <label htmlFor="confettiMode">
                {t("confetti.mode", language)}
              </label>
              <div className="select-wrap">
                <select
                  id="confettiMode"
                  className="input"
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
                  className="fa-solid fa-chevron-down select-chevron"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div className="setting-box">
            <div className="profile-toggle-row">
              <span>{t("pageTransition.enable", language)}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pageTransitionSettings.enabled}
                  onChange={(event) =>
                    updatePageTransitionSettings({
                      enabled: event.target.checked,
                    })
                  }
                />
                <span className="toggle-slider" aria-hidden="true" />
              </label>
            </div>
            <div className="field">
              <label htmlFor="pageTransitionMode">
                {t("pageTransition.mode", language)}
              </label>
              <div className="select-wrap">
                <select
                  id="pageTransitionMode"
                  className="input"
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
                  className="fa-solid fa-chevron-down select-chevron"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeSettings}>
              {t("common.close", language)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title={t("appShell.passwordModalTitle", language)}
      >
        <form className="stack" onSubmit={submitPasswordChange}>
          <div className="field">
            <label htmlFor="currentPassword">
              {t("appShell.currentPassword", language)}
            </label>
            <div className="password-input-wrap">
              <input
                id="currentPassword"
                type={passwordVisibility.current ? "text" : "password"}
                className="input password-input"
                value={passwordForm.current}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    current: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility("current")}
                title={
                  passwordVisibility.current
                    ? t("appShell.hidePassword", language)
                    : t("appShell.showPassword", language)
                }
                aria-label={
                  passwordVisibility.current
                    ? t("appShell.hidePassword", language)
                    : t("appShell.showPassword", language)
                }
              >
                <i
                  className={
                    passwordVisibility.current
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="nextPassword">
              {t("appShell.newPassword", language)}
            </label>
            <div className="password-input-wrap">
              <input
                id="nextPassword"
                type={passwordVisibility.next ? "text" : "password"}
                className="input password-input"
                value={passwordForm.next}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    next: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility("next")}
                title={
                  passwordVisibility.next
                    ? t("appShell.hidePassword", language)
                    : t("appShell.showPassword", language)
                }
                aria-label={
                  passwordVisibility.next
                    ? t("appShell.hidePassword", language)
                    : t("appShell.showPassword", language)
                }
              >
                <i
                  className={
                    passwordVisibility.next
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">
              {t("appShell.confirmPassword", language)}
            </label>
            <div className="password-input-wrap">
              <input
                id="confirmPassword"
                type={passwordVisibility.confirm ? "text" : "password"}
                className="input password-input"
                value={passwordForm.confirm}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirm: event.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility("confirm")}
                title={
                  passwordVisibility.confirm
                    ? t("appShell.hidePassword", language)
                    : t("appShell.showPassword", language)
                }
                aria-label={
                  passwordVisibility.confirm
                    ? t("appShell.hidePassword", language)
                    : t("appShell.showPassword", language)
                }
              >
                <i
                  className={
                    passwordVisibility.confirm
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {passwordMessage.text ? (
            <p
              className={
                passwordMessage.type === "error" ? "error-text" : "success-text"
              }
            >
              {passwordMessage.text}
            </p>
          ) : null}

          <div className="modal-actions">
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
