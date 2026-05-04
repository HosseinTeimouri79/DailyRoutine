export default function IconButton({
  icon,
  label,
  className = "",
  type = "button",
  ...props
}) {
  const accessibleLabel = props["aria-label"] || label || props.title;
  const title = props.title || label;

  return (
    <button
      type={type}
      className={`icon-btn ${className}`.trim()}
      aria-label={accessibleLabel}
      title={title}
      {...props}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  );
}
