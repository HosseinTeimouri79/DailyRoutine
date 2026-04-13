import "./Snackbar.css";

export default function Snackbar({ open, type = "success", message }) {
  if (!open || !message) return null;

  const ICONS = {
    info: "fa-solid fa-circle-info",
    success: "fa-solid fa-circle-check",
    warn: "fa-solid fa-triangle-exclamation",
    error: "fa-solid fa-circle-xmark",
  };

  const nextType = ["info", "success", "warn", "error"].includes(type)
    ? type
    : "info";

  return (
    <div className={`snackbar ${nextType}`} role="status" aria-live="polite">
      <span className="snackbar-icon">
        <i className={ICONS[nextType]} aria-hidden="true" />
      </span>
      <span>{message}</span>
    </div>
  );
}
