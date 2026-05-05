export default function IconButton({
  icon,
  label,
  className = "",
  type = "button",
  ...props
}) {
  const accessibleLabel = props["aria-label"] || label || props.title;
  const title = props.title || label;

  const isDelete = className.includes("delete");

  return (
    <button
      type={type}
      className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-[7px]",
        "border leading-none cursor-pointer",
        isDelete
          ? "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          : "border-[var(--color-border-strong)] bg-[var(--color-bg-control)] text-[0.8rem] text-[var(--color-secondary)]",
        className.replace("delete", "").trim(),
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={accessibleLabel}
      title={title}
      {...props}
    >
      <i className={`${icon} leading-none pointer-events-none`} aria-hidden="true" />
    </button>
  );
}
