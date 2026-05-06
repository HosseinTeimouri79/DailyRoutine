import { useEffect, useMemo, useRef, useState } from "react";

export default function Dropdown({
  options = [],
  placeholder = "Select...",
  value,
  onChange,
  onSelect,
  disabled = false,
  id,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  optionClassName = "",
  noOptionsLabel = "No options",
  maxVisibleOptions = 5,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  const selected = useMemo(
    () =>
      options.find((option) => String(option.value) === String(value)) || null,
    [options, value],
  );

  const handleSelect = (option) => {
    if (option?.disabled) return;
    setIsOpen(false);
    onChange && onChange(option.value, option);
    onSelect && onSelect(option);
  };

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  return (
    <div className={`relative min-w-0 ${className}`.trim()} ref={ref}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
          "bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)]",
          "focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)] focus:border-[var(--color-primary)]",
          "disabled:bg-[color-mix(in_srgb,var(--color-bg-surface-soft)_82%,var(--color-bg-page))]",
          "disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
          triggerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        {...props}
      >
        <span className="truncate text-start">
          {selected?.label ?? placeholder}
        </span>
        <i
          className={[
            "fa-solid fa-chevron-down text-[0.82rem] transition-transform",
            isOpen ? "rotate-180" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={[
            "absolute mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
            "bg-[var(--color-bg-surface)] shadow-lg z-50 overflow-x-hidden overflow-y-auto",
            menuClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            maxHeight: `${Math.max(1, Number(maxVisibleOptions) || 4) * 44}px`,
          }}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2.5 text-[0.88rem] text-[var(--color-text-muted)]">
              {noOptionsLabel}
            </div>
          ) : (
            options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={[
                  "w-full text-start px-3 py-2.5 text-[0.9rem] cursor-pointer",
                  "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-soft)]",
                  "disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
                  selected && String(selected.value) === String(option.value)
                    ? "bg-[color-mix(in_srgb,var(--color-primary-soft)_60%,transparent)]"
                    : "",
                  optionClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={
                  selected && String(selected.value) === String(option.value)
                }
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
