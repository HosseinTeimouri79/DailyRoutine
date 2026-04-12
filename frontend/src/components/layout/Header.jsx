import Button from "../ui/Button";
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
      <div>
        <h1>{title}</h1>
        <p>
          {user ? `سلام ${user.name} عزیر ` : ""}
          <i
            className="fa-solid fa-arrow-left app-inline-icon"
            aria-hidden="true"
          />
          <span
            style={{
              fontWeight: "bold",
              color: "#4CAF50",
              paddingInlineStart: "1rem",
            }}
          >
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
        <Button variant="secondary" onClick={onLogout}>
          خروج
        </Button>
      </div>
    </header>
  );
}
