import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getUser, setSession } from "../../lib/api";
import Button from "../ui/Button";

export default function AppShell({ title, children }) {
  const initialUser = getUser();
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
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
    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setPasswordMessage({ type: "", text: "" });
    setPasswordForm({ current: "", next: "", confirm: "" });
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
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <p>
            {user ? `سلام ${user.name} عزیر - ` : ""}
            <span style={{ fontWeight: "bold", color: "#4CAF50" }}>
              امروز بهترین فرصت برای ساختن فردای توست! 🌟
            </span>
          </p>
        </div>
        <div className="topbar-actions">
          <button
            className="profile-toggle-btn"
            onClick={openProfile}
            title="پروفایل"
            aria-label="پروفایل"
          >
            👤
          </button>
          <button
            className="theme-toggle-btn"
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
            title="تغییر تم"
            aria-label="تغییر تم"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Button variant="secondary" onClick={logout}>
            خروج
          </Button>
        </div>
      </header>

      <main className="content-grid">{children}</main>

      {isProfileOpen ? (
        <div className="modal-backdrop" onClick={closeProfile}>
          <div
            className="modal-card profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">پروفایل کاربری</h3>

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
              <div className="profile-meta">
                <p>نام:{user?.name || "-"}</p>
                <p>ایمیل:{user?.email || "-"}</p>
              </div>
            </div>

            {profileMessage.text ? (
              <p
                className={
                  profileMessage.type === "error"
                    ? "error-text"
                    : "success-text"
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
            {profileLoading ? (
              <p className="muted">در حال بروزرسانی...</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isPasswordModalOpen ? (
        <div className="modal-backdrop" onClick={closePasswordModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">تغییر رمز عبور</h3>
            <form className="stack" onSubmit={submitPasswordChange}>
              <div className="field">
                <label htmlFor="currentPassword">رمز فعلی</label>
                <input
                  id="currentPassword"
                  type="password"
                  className="input"
                  value={passwordForm.current}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="nextPassword">رمز جدید</label>
                <input
                  id="nextPassword"
                  type="password"
                  className="input"
                  value={passwordForm.next}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      next: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">تکرار رمز جدید</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input"
                  value={passwordForm.confirm}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm: event.target.value,
                    }))
                  }
                />
              </div>

              {passwordMessage.text ? (
                <p
                  className={
                    passwordMessage.type === "error"
                      ? "error-text"
                      : "success-text"
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
