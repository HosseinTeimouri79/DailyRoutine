export default function Button({
  children,
  variant = "primary",
  icon,
  iconPosition = "start",
  className = "",
  ...props
}) {
  const base =
    "border-0 rounded-[var(--radius-sm)] px-3.5 py-2.5 cursor-pointer font-semibold disabled:opacity-70 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "text-[var(--color-text-on-accent)] [background:linear-gradient(135deg,var(--color-primary),var(--color-primary-strong))]",
    secondary:
      "bg-[var(--color-primary-soft)] text-[var(--color-secondary)] border border-[var(--color-border-strong)]",
    danger:
      "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger-border)]",
  };

  const variantClass = variants[variant] || variants.primary;

  return (
    <button
      className={[
        base,
        variantClass,
        icon ? "inline-flex items-center justify-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon ? (
        <span className="inline-flex items-center gap-2">
          {iconPosition === "start" ? (
            <i className={`text-[0.95rem] ${icon}`} aria-hidden="true" />
          ) : null}
          <span>{children}</span>
          {iconPosition === "end" ? (
            <i className={`text-[0.95rem] ${icon}`} aria-hidden="true" />
          ) : null}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
