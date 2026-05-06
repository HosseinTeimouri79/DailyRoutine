import { useId } from "react";

export default function Checkbox({
  checked = false,
  onChange,
  label,
  children,
  id,
  name,
  value,
  type = "checkbox",
  variant = "checkbox",
  disabled = false,
  className = "",
  labelClassName = "",
  controlClassName = "",
  textClassName = "",
  inputClassName = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const content = label ?? children;
  const isPlain = variant === "plain";
  const isRadio = type === "radio";

  return (
    <label
      className={[
        "inline-flex items-center gap-2 select-none",
        disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      htmlFor={inputId}
    >
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={["sr-only", inputClassName].filter(Boolean).join(" ")}
        {...props}
      />

      {!isPlain ? (
        <span
          className={[
            "inline-flex h-5 w-5 shrink-0 items-center justify-center border transition-colors",
            isRadio ? "rounded-full" : "rounded-[6px]",
            checked
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] text-transparent",
            disabled ? "opacity-70" : "",
            controlClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        >
          {checked ? (
            <i
              className={
                isRadio
                  ? "fa-solid fa-circle text-[0.42rem]"
                  : "fa-solid fa-check text-[0.68rem]"
              }
              aria-hidden="true"
            />
          ) : null}
        </span>
      ) : null}

      {content != null ? (
        <span
          className={[textClassName, labelClassName].filter(Boolean).join(" ")}
        >
          {content}
        </span>
      ) : null}
    </label>
  );
}
