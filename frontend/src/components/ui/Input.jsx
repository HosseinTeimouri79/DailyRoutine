export default function Input({ label, id, error, ...props }) {
  return (
    <div className="grid gap-1.5 w-full">
      {label ? (
        <label htmlFor={id} className="text-[var(--color-text-secondary)] text-[0.9rem]">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={[
          "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
          "bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)]",
          "focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)]",
          "focus:border-[var(--color-primary)]",
          "disabled:bg-[color-mix(in_srgb,var(--color-bg-surface-soft)_82%,var(--color-bg-page))]",
          "disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
          error ? "border-[var(--color-danger-border)]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error ? (
        <small className="text-[var(--color-danger)] text-[0.8rem]">{error}</small>
      ) : null}
    </div>
  );
}
