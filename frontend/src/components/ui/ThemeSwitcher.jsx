import { useId } from "react";
import { THEME_OPTIONS } from "../../lib/themes";
import Dropdown from "./Dropdown";

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
      <Dropdown
        id={selectId}
        className="w-full"
        value={value}
        options={THEME_OPTIONS}
        onChange={(nextValue) => onChange?.(nextValue)}
        aria-label={label}
        {...props}
      />
    </div>
  );
}
