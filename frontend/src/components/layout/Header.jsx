import Button from "../ui/Button";

export default function Header({
  title,
  user,
  theme,
  onOpenProfile,
  onToggleTheme,
  onLogout,
}) {
  return (
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
          onClick={onOpenProfile}
          title="پروفایل"
          aria-label="پروفایل"
        >
          👤
        </button>
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title="تغییر تم"
          aria-label="تغییر تم"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <Button variant="secondary" onClick={onLogout}>
          خروج
        </Button>
      </div>
    </header>
  );
}
