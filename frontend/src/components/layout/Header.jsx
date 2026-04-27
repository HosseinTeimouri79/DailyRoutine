import { useEffect, useRef, useState } from "react";
import { t } from "../../lib/i18n";
import { motivationalTexts } from "../../data/motivationalTexts";
import "./Header.css";

function getRandomMotivationalText(language) {
  const texts = motivationalTexts[language === "fa" ? "fa" : "en"] || [];
  return texts[Math.floor(Math.random() * texts.length)] || "";
}

export default function Header({
  title,
  user,
  theme,
  language,
  onOpenProfile,
  onToggleTheme,
  onChangeLanguage,
  onLogout,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [randomText, setRandomText] = useState(() =>
    getRandomMotivationalText(language),
  );

  useEffect(() => {
    setRandomText(getRandomMotivationalText(language));
  }, [language]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleOutsideClick(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isMenuOpen]);

  function openProfileFromMenu() {
    onOpenProfile?.();
    setIsMenuOpen(false);
  }

  function toggleThemeFromMenu() {
    onToggleTheme?.();
    setIsMenuOpen(false);
  }

  function toggleLanguageFromMenu() {
    onChangeLanguage?.();
    setIsMenuOpen(false);
  }

  function logoutFromMenu() {
    onLogout?.();
    setIsMenuOpen(false);
  }

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="topbar-brand">
          <img
            className="topbar-logo"
            src="/assets/logo/logo.svg"
            alt={t("header.logoAlt", language)}
          />
          <h1>{title}</h1>
        </div>
        <div className="topbar-menu" ref={menuRef}>
          <button
            type="button"
            className="hamburger-toggle-btn"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={t("header.menu", language)}
            aria-label={t("header.menu", language)}
            aria-expanded={isMenuOpen}
          >
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </button>

          <div className={`topbar-actions ${isMenuOpen ? "open" : ""}`.trim()}>
            <button
              className="profile-toggle-btn"
              onClick={openProfileFromMenu}
              title={t("header.profile", language)}
              aria-label={t("header.profile", language)}
            >
              <i className="fa-solid fa-user" aria-hidden="true" />
            </button>
            <button
              className="theme-toggle-btn"
              onClick={toggleThemeFromMenu}
              title={t("header.theme", language)}
              aria-label={t("header.theme", language)}
            >
              <i
                className={
                  theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"
                }
                aria-hidden="true"
              />
            </button>
            <button
              className="language-toggle-btn"
              onClick={toggleLanguageFromMenu}
              title={t("header.language", language)}
              aria-label={t("header.language", language)}
            >
              <span>{language === "fa" ? "EN" : "FA"}</span>
            </button>
            <button
              className="logout-toggle-btn"
              onClick={logoutFromMenu}
              title={t("header.logout", language)}
              aria-label={t("header.logout", language)}
            >
              <i
                className="fa-solid fa-right-from-bracket"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
      <span className="topbar-motivation">
        {randomText}
        <i className="fa-solid fa-star app-inline-icon" aria-hidden="true" />
      </span>
    </header>
  );
}
