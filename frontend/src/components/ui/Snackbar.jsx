export default function Snackbar({ open, type = "success", message }) {
  if (!open || !message) return null;

  const ICONS = {
    info: "ℹ",
    success: "✓",
    warn: "⚠",
    error: "⨯",
  };

  const nextType = ["info", "success", "warn", "error"].includes(type)
    ? type
    : "info";

  return (
    <div className={`snackbar ${nextType}`} role="status" aria-live="polite">
      <span className="snackbar-icon">{ICONS[nextType]}</span>
      <span>{message}</span>
    </div>
  );
}
