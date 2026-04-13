import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getUser, setSession } from "../../lib/api";
import Header from "./Header";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import "./AppShell.css";

export default function AppShell({ title, children }) {
  const initialUser = getUser();
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileName, setProfileName] = useState(initialUser?.name || "");
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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("dr_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dr_theme", theme);
  }, [theme]);

  function openProfile() {
    setProfileMessage({ type: "", text: "" });
    setProfileName(user?.name || "");
    setIsProfileOpen(true);
    syncProfile();
  }

  function closeProfile() {
    setIsProfileOpen(false);
    setProfileMessage({ type: "", text: "" });
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
      const token = localStorage.getItem("dr_token");
      if (token) setSession(token, merged);
    } catch {
      setProfileMessage({
        type: "error",
        text: "بارگذاری اطلاعات پروفایل ناموفق بود.",
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
        const token = localStorage.getItem("dr_token");
        if (token) setSession(token, updatedUser);
        setProfileMessage({ type: "success", text: "تصویر پروفایل ذخیره شد." });
      } catch (error) {
        setProfileMessage({
          type: "error",
          text: error.message || "ذخیره تصویر ناموفق بود.",
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
        text: "نام کاربری نمی‌تواند خالی باشد.",
      });
      return;
    }

    try {
      setProfileLoading(true);
      const updatedUser = await api.updateProfile({ name: nextName });
      setUser(updatedUser);
      setProfileName(updatedUser?.name || nextName);
      const token = localStorage.getItem("dr_token");
      if (token) setSession(token, updatedUser);
      setProfileMessage({
        type: "success",
        text: "نام کاربری با موفقیت ذخیره شد.",
      });
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error.message || "ذخیره نام کاربری ناموفق بود.",
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
        text: "تمام فیلدهای رمز را تکمیل کنید.",
      });
      return;
    }

    if (passwordForm.next.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "رمز جدید باید حداقل ۶ کاراکتر باشد.",
      });
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({
        type: "error",
        text: "تکرار رمز جدید با رمز جدید یکسان نیست.",
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
        text: "رمز عبور با موفقیت تغییر کرد.",
      });
      setTimeout(() => {
        closePasswordModal();
      }, 800);
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error.message || "تغییر رمز ناموفق بود.",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell" dir="rtl">
      <Header
        title={title}
        user={user}
        theme={theme}
        onOpenProfile={openProfile}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        onLogout={logout}
      />

      <main className="content-grid">{children}</main>

      <Modal
        isOpen={isProfileOpen}
        onClose={closeProfile}
        title="پروفایل کاربری"
        className="profile-modal"
      >
        <div className="profile-identity">
          <div className="profile-avatar-wrap">
            <button
              className="profile-avatar-btn"
              onClick={onAvatarClick}
              title="تغییر تصویر پروفایل"
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="تصویر پروفایل"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {(user?.name || "کاربر").slice(0, 1)}
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
              <label htmlFor="profileName">نام کاربری</label>
              <input
                id="profileName"
                className="input"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="profilePhone">شماره تلفن</label>
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
                {profileLoading ? "در حال ذخیره..." : "ذخیره نام کاربری"}
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
            تغییر رمز عبور
          </Button>
          <Button type="button" variant="secondary" onClick={closeProfile}>
            بستن
          </Button>
        </div>
        {profileLoading ? <p className="muted">در حال بروزرسانی...</p> : null}
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        title="تغییر رمز عبور"
      >
        <form className="stack" onSubmit={submitPasswordChange}>
          <div className="field">
            <label htmlFor="currentPassword">رمز فعلی</label>
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
                  passwordVisibility.current ? "مخفی کردن رمز" : "نمایش رمز"
                }
                aria-label={
                  passwordVisibility.current ? "مخفی کردن رمز" : "نمایش رمز"
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
            <label htmlFor="nextPassword">رمز جدید</label>
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
                title={passwordVisibility.next ? "مخفی کردن رمز" : "نمایش رمز"}
                aria-label={
                  passwordVisibility.next ? "مخفی کردن رمز" : "نمایش رمز"
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
            <label htmlFor="confirmPassword">تکرار رمز جدید</label>
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
                  passwordVisibility.confirm ? "مخفی کردن رمز" : "نمایش رمز"
                }
                aria-label={
                  passwordVisibility.confirm ? "مخفی کردن رمز" : "نمایش رمز"
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
              انصراف
            </Button>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "در حال ثبت..." : "ذخیره تغییر رمز"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
