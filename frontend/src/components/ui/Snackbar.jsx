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

  const bgColors = {
    info: "bg-[var(--color-snackbar-info)]",
    success: "bg-[var(--color-snackbar-success)]",
    warn: "bg-[var(--color-snackbar-warn)]",
    error: "bg-[var(--color-snackbar-error)]",
  };

  return (
    <div
      className={[
        "fixed top-[18px] right-[18px] min-w-[220px] rounded-[var(--radius-sm)]",
        "px-3.5 py-2.5 text-[var(--color-text-on-accent)] text-[0.9rem]",
        "shadow-[var(--shadow-card)] z-[1200] inline-flex items-center gap-2",
        "[max-width:min(92vw,420px)]",
        "max-[720px]:top-auto max-[720px]:bottom-3.5 max-[720px]:left-3 max-[720px]:right-3 max-[720px]:[max-width:none]",
        bgColors[nextType],
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <span className="w-[18px] h-[18px] inline-flex items-center justify-center font-bold leading-none pointer-events-none">
        <i className={ICONS[nextType]} aria-hidden="true" />
      </span>
      <span>{message}</span>
    </div>
  );
}
