import { useId } from "react";
import { THEME_OPTIONS } from "../../lib/themes";
import "./ThemeSwitcher.css";

export default function ThemeSwitcher({
  value,
  onChange,
  label,
  className = "",
  ...props
}) {
  const selectId = useId();

  return (
    <div className={`theme-switcher ${className}`.trim()}>
      {label ? (
        <label className="theme-switcher-label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <div className="theme-switcher-control">
        <select
          id={selectId}
          className="input theme-switcher-select"
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
          className="fa-solid fa-chevron-down theme-switcher-chevron"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
