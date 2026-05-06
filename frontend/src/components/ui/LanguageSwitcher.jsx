import { useId } from "react";
import { LANGUAGE_OPTIONS } from "../../lib/languages";
import Dropdown from "./Dropdown";

export default function LanguageSwitcher({
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
        options={LANGUAGE_OPTIONS}
        onChange={(nextValue) => onChange?.(nextValue)}
        aria-label={label}
        {...props}
      />
    </div>
  );
}
