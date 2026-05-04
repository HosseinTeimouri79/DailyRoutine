import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  icon,
  iconPosition = "start",
  className = "",
  ...props
}) {
  const classes =
    variant === "secondary"
      ? "btn btn-secondary"
      : variant === "danger"
        ? "btn btn-danger"
        : "btn btn-primary";

  return (
    <button
      className={`${classes} ${icon ? "btn-with-icon" : ""} ${className}`.trim()}
      {...props}
    >
      {icon ? (
        <span className="btn-content">
          {iconPosition === "start" ? (
            <i className={`btn-icon ${icon}`} aria-hidden="true" />
          ) : null}
          <span>{children}</span>
          {iconPosition === "end" ? (
            <i className={`btn-icon ${icon}`} aria-hidden="true" />
          ) : null}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
