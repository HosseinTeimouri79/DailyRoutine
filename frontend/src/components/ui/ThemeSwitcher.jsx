import { useId } from "react";
import { THEME_OPTIONS } from "../../lib/themes";

export default function ThemeSwitcher({
  value,
  onChange,
  label,
  className = "",
  ...props
}) {
  const selectId = useId();

  return (
    <div className={`grid gap-1.5 min-w-0 ${className}`.trim()}>
      {label ? (
        <label
          className="text-[var(--color-text-secondary)] text-[0.88rem] font-semibold"
          htmlFor={selectId}
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)] appearance-none cursor-pointer focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)] focus:border-[var(--color-primary)] [padding-inline-end:36px]"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          aria-label={label}
          {...props}
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <i
          className="fa-solid fa-chevron-down absolute text-[var(--color-text-secondary)] pointer-events-none text-[0.82rem] [inset-inline-end:12px] top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
