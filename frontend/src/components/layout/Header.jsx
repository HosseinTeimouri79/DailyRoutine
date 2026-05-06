import { useEffect, useRef, useState } from "react";
import { t } from "../../lib/i18n";
import { motivationalTexts } from "../../data/motivationalTexts";

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
  onOpenSettings,
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
      if (!menuRef.current.contains(event.target)) setIsMenuOpen(false);
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

  function logoutFromMenu() {
    onLogout?.();
    setIsMenuOpen(false);
  }

  const actionBtnBase =
    "w-9 h-9 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] text-[var(--color-secondary)] cursor-pointer";

  return (
    <header
      className="border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-[18px] grid gap-2 max-[720px]:p-3.5 max-[720px]:gap-1"
      style={{
        background:
          "color-mix(in srgb, var(--color-bg-surface) 88%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img
            className="w-[30px] h-[30px] object-contain block max-[720px]:w-[26px] max-[720px]:h-[26px]"
            src="/assets/logo/logo.svg"
            alt={t("header.logoAlt", language)}
          />
          <h1 className="m-0 text-[var(--font-size-title)] max-[720px]:text-[1.1rem]">
            {title}
          </h1>
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="hidden w-9 h-9 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] text-[var(--color-secondary)] cursor-pointer max-[720px]:inline-flex max-[720px]:items-center max-[720px]:justify-center"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title={t("header.menu", language)}
            aria-label={t("header.menu", language)}
            aria-expanded={isMenuOpen}
          >
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </button>

          <div
            className={[
              "flex items-center gap-2",
              isMenuOpen ? "max-[720px]:grid" : "max-[720px]:hidden",
              "max-[720px]:absolute max-[720px]:top-[calc(100%+8px)] max-[720px]:left-0 max-[720px]:right-auto",
              "max-[720px]:bg-[var(--color-bg-surface)] max-[720px]:border max-[720px]:border-[var(--color-border-default)]",
              "max-[720px]:rounded-[var(--radius-md)] max-[720px]:shadow-[var(--shadow-card)] max-[720px]:p-2 max-[720px]:min-w-[6rem] max-[720px]:z-50 max-[720px]:gap-1.5",
            ].join(" ")}
          >
            <button
              className={`${actionBtnBase} max-[720px]:w-full max-[720px]:inline-flex max-[720px]:items-center max-[720px]:justify-center`}
              onClick={() => {
                onOpenSettings?.();
                setIsMenuOpen(false);
              }}
              title={t("header.settings", language)}
              aria-label={t("header.settings", language)}
            >
              <i className="fa-solid fa-gear" aria-hidden="true" />
            </button>
            <button
              className={`${actionBtnBase} max-[720px]:w-full max-[720px]:inline-flex max-[720px]:items-center max-[720px]:justify-center`}
              onClick={openProfileFromMenu}
              title={t("header.profile", language)}
              aria-label={t("header.profile", language)}
            >
              <i className="fa-solid fa-user" aria-hidden="true" />
            </button>
            <button
              className={`${actionBtnBase} max-[720px]:w-full max-[720px]:inline-flex max-[720px]:items-center max-[720px]:justify-center`}
              onClick={logoutFromMenu}
              title={t("header.logout", language)}
              aria-label={t("header.logout", language)}
            >
              <i
                className="fa-solid fa-right-from-bracket leading-none pointer-events-none"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      <span className="font-bold text-[var(--color-success)] flex justify-center items-center w-full max-[720px]:inline max-[720px]:leading-[1.6]">
        {randomText}
        <i className="fa-solid fa-star mr-1 text-[0.9em]" aria-hidden="true" />
      </span>
    </header>
  );
}
