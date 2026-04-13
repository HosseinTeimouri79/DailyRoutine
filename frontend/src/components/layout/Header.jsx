import { motivationalTexts } from "../../data/motivationalTexts";

export default function Header({
  title,
  user,
  theme,
  onOpenProfile,
  onToggleTheme,
  onLogout,
}) {
  const randomText =
    motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)];

  return (
    <header className="topbar">
      <div className="topbar-info">
        <h1>{title}</h1>
        <p className="topbar-user-info">
          <span>{user ? `سلام ${user.name} عزیر ` : ""}</span>
          <span className="topbar-motivation">
            {randomText}
            <i
              className="fa-solid fa-star app-inline-icon"
              aria-hidden="true"
            />
          </span>
        </p>
      </div>
      <div className="topbar-actions">
        <button
          className="profile-toggle-btn"
          onClick={onOpenProfile}
          title="پروفایل"
          aria-label="پروفایل"
        >
          <i className="fa-solid fa-user" aria-hidden="true" />
        </button>
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title="تغییر تم"
          aria-label="تغییر تم"
        >
          <i
            className={
              theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"
            }
            aria-hidden="true"
          />
        </button>
        <button
          className="logout-toggle-btn"
          onClick={onLogout}
          title="خروج"
          aria-label="خروج"
        >
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
