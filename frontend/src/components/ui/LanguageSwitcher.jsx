import { useId } from "react";
import { LANGUAGE_OPTIONS } from "../../lib/languages";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher({
  value,
  onChange,
  label,
  className = "",
  ...props
}) {
  const selectId = useId();

  return (
    <div className={`language-switcher ${className}`.trim()}>
      {label ? (
        <label className="language-switcher-label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <div className="language-switcher-control">
        <select
          id={selectId}
          className="input language-switcher-select"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          aria-label={label}
          {...props}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <i
          className="fa-solid fa-chevron-down language-switcher-chevron"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
