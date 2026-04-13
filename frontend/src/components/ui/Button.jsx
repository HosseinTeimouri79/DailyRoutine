import "./Button.css";

export default function Button({
  children,
  variant = "primary",
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
    <button className={`${classes} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
