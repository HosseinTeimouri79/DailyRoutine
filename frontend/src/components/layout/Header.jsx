import { useState } from "react";
import { motivationalTexts } from "../../data/motivationalTexts";
import "./Header.css";

export default function Header({
  title,
  user,
  theme,
  onOpenProfile,
  onToggleTheme,
  onLogout,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const randomText =
    motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)];

  function openProfileFromMenu() {
    onOpenProfile?.();
    setIsMenuOpen(false);
  }

  function toggleThemeFromMenu() {
    onToggleTheme?.();
    setIsMenuOpen(false);
  }

  function logoutFromMenu() {
    onLogout?.();
    setIsMenuOpen(false);
  }

  return (
    <header className="topbar">
      <div className="topbar-info">
        <h1>{title}</h1>
        <span className="topbar-motivation">
          {randomText}
          <i className="fa-solid fa-star app-inline-icon" aria-hidden="true" />
        </span>
      </div>

      <div className="topbar-menu">
        <button
          type="button"
          className="hamburger-toggle-btn"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title="منو"
          aria-label="منو"
          aria-expanded={isMenuOpen}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>

        <div className={`topbar-actions ${isMenuOpen ? "open" : ""}`.trim()}>
          <button
            className="profile-toggle-btn"
            onClick={openProfileFromMenu}
            title="پروفایل"
            aria-label="پروفایل"
          >
            <i className="fa-solid fa-user" aria-hidden="true" />
          </button>
          <button
            className="theme-toggle-btn"
            onClick={toggleThemeFromMenu}
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
            onClick={logoutFromMenu}
            title="خروج"
            aria-label="خروج"
          >
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
