import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { t } from "../../lib/i18n";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseTime(value, fallback = "09:00") {
  const raw =
    typeof value === "string" && value.includes(":") ? value : fallback;
  const [h, m] = raw.split(":");
  const hour = Math.min(23, Math.max(0, Number(h) || 0));
  const minute = Math.min(59, Math.max(0, Number(m) || 0));
  return { hour, minute };
}

function formatTimeLabel(hour, minute, use24, language) {
  if (use24) {
    return `${pad2(hour)}:${pad2(minute)}`;
  }
  const isPm = hour >= 12;
  const displayHour = ((hour + 11) % 12) + 1;
  const suffix = isPm
    ? t("timePicker.pm", language)
    : t("timePicker.am", language);
  return `${pad2(displayHour)}:${pad2(minute)} ${suffix}`;
}

function buildHourOptions(use24) {
  if (!use24) {
    return Array.from({ length: 12 }, (_, i) => {
      const value = i === 0 ? 12 : i;
      return { value, label: pad2(value), ring: "outer", pos: i };
    });
  }
  return Array.from({ length: 24 }, (_, hour) => {
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const pos = display % 12;
    const ring = hour >= 13 || hour === 0 ? "inner" : "outer";
    return { value: hour, label: pad2(hour), ring, pos };
  });
}

function buildMinuteOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: index * 5,
    label: pad2(index * 5),
    pos: index,
  }));
}

function getHourFromDisplay(hour12, isPm) {
  if (isPm) return hour12 === 12 ? 12 : hour12 + 12;
  return hour12 === 12 ? 0 : hour12;
}

export default function TimePicker({
  value,
  onChange,
  label,
  disabled = false,
  language,
  defaultFormat = "24",
  ariaLabel,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [is24, setIs24] = useState(defaultFormat === "24");
  const [mode, setMode] = useState("hour");
  const [{ hour, minute }, setDraft] = useState(() => parseTime(value));

  useEffect(() => {
    if (!isOpen) return;
    setDraft(parseTime(value));
    setMode("hour");
  }, [isOpen, value]);

  const isPm = hour >= 12;
  const displayHour = ((hour + 11) % 12) + 1;
  const hourOptions = useMemo(() => buildHourOptions(is24), [is24]);
  const minuteOptions = useMemo(() => buildMinuteOptions(), []);

  function closeModal() {
    setIsOpen(false);
    setMode("hour");
  }

  function commitSelection() {
    onChange?.(`${pad2(hour)}:${pad2(minute)}`);
    closeModal();
  }

  function handleHourSelect(option) {
    if (is24) {
      setDraft((prev) => ({ ...prev, hour: option.value }));
    } else {
      const nextHour = getHourFromDisplay(option.value, isPm);
      setDraft((prev) => ({ ...prev, hour: nextHour }));
    }
    setMode("minute");
  }

  function handleMinuteSelect(nextMinute) {
    setDraft((prev) => ({ ...prev, minute: nextMinute }));
  }

  function handleToggleMeridiem(nextIsPm) {
    const nextHour = getHourFromDisplay(displayHour, nextIsPm);
    setDraft((prev) => ({ ...prev, hour: nextHour }));
  }

  function adjustMinute(step) {
    setDraft((prev) => {
      const next = (prev.minute + step + 60) % 60;
      return { ...prev, minute: next };
    });
  }

  const inputValue = formatTimeLabel(hour, minute, is24, language);
  const handAngle =
    mode === "hour"
      ? is24
        ? ((hour % 12) / 12) * 360
        : ((displayHour % 12) / 12) * 360
      : (minute / 60) * 360;
  const handIsInner = mode === "hour" && is24 && (hour >= 13 || hour === 0);

  const chipBase =
    "rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-[0.85rem] text-[var(--color-text-secondary)] cursor-pointer";
  const chipActive =
    "bg-[var(--color-primary-soft)] text-[var(--color-text-primary)] border-[var(--color-primary)]";

  return (
    <div className={`grid gap-1.5 ${className}`.trim()}>
      {label ? (
        <label className="text-[var(--color-text-secondary)] text-[0.9rem]">
          {label}
        </label>
      ) : null}
      <input
        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        type="text"
        value={inputValue}
        readOnly
        onMouseDown={() => {
          if (!disabled) setIsOpen(true);
        }}
        disabled={disabled}
        aria-label={ariaLabel || label}
      />

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={t("timePicker.title", language)}
      >
        <div className="grid gap-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-[1.4rem] font-bold text-[var(--color-text-primary)]">
              {formatTimeLabel(hour, minute, is24, language)}
            </div>
            <div className="inline-flex gap-2">
              <button
                type="button"
                className={`${chipBase} ${!is24 ? chipActive : ""}`}
                onClick={() => setIs24(false)}
              >
                {t("timePicker.format12", language)}
              </button>
              <button
                type="button"
                className={`${chipBase} ${is24 ? chipActive : ""}`}
                onClick={() => setIs24(true)}
              >
                {t("timePicker.format24", language)}
              </button>
            </div>
          </div>

          {/* AM/PM */}
          {!is24 ? (
            <div className="inline-flex gap-2">
              <button
                type="button"
                className={`${chipBase} ${!isPm ? chipActive : ""}`}
                onClick={() => handleToggleMeridiem(false)}
              >
                {t("timePicker.am", language)}
              </button>
              <button
                type="button"
                className={`${chipBase} ${isPm ? chipActive : ""}`}
                onClick={() => handleToggleMeridiem(true)}
              >
                {t("timePicker.pm", language)}
              </button>
            </div>
          ) : null}

          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-2">
            {["hour", "minute"].map((m) => (
              <button
                key={m}
                type="button"
                className={[
                  "rounded-[var(--radius-sm)] border border-[var(--color-border-default)]",
                  "bg-[var(--color-bg-surface)] px-2.5 py-2 text-[var(--color-text-secondary)] font-semibold cursor-pointer",
                  mode === m
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text-primary)]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setMode(m)}
              >
                {t(`timePicker.${m}`, language)}
              </button>
            ))}
          </div>

          {/* Clock face */}
          <div
            className="relative w-[220px] h-[220px] mx-auto rounded-full border border-[var(--color-border-default)] max-[720px]:w-[200px] max-[720px]:h-[200px]"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, var(--color-bg-surface), var(--color-bg-surface-soft))",
            }}
          >
            {/* Hand */}
            <div
              className={[
                "absolute top-1/2 left-1/2 w-[2px] bg-[var(--color-primary)] rounded-full",
                handIsInner ? "h-[60px]" : "h-[86px]",
              ].join(" ")}
              style={{
                transformOrigin: "bottom center",
                transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
              }}
            >
              <div
                className="absolute bottom-0 left-1/2 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"
                style={{ transform: "translate(-50%, 50%)" }}
              />
            </div>

            {/* Numbers */}
            {(mode === "hour" ? hourOptions : minuteOptions).map((option) => {
              const isSelected =
                mode === "hour"
                  ? option.value === hour
                  : option.value === minute - (minute % 5);
              const radius = option.ring === "inner" ? 52 : 90;
              const angle = (option.pos / 12) * 360;
              const transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`;

              return (
                <button
                  key={`${mode}-${option.value}`}
                  type="button"
                  className={[
                    "absolute top-1/2 left-1/2 rounded-full border border-[var(--color-border-default)]",
                    "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] inline-flex items-center justify-center cursor-pointer",
                    option.ring === "inner"
                      ? "w-7 h-7 text-[0.72rem]"
                      : "w-[34px] h-[34px] text-[0.8rem]",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ transform }}
                  onClick={() =>
                    mode === "hour"
                      ? handleHourSelect(option)
                      : handleMinuteSelect(option.value)
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Minute fine-tune */}
          <div className="inline-flex items-center justify-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-[8px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] cursor-pointer text-base"
              onClick={() => adjustMinute(-1)}
            >
              -
            </button>
            <span className="min-w-[32px] text-center font-semibold">
              {pad2(minute)}
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded-[8px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] cursor-pointer text-base"
              onClick={() => adjustMinute(1)}
            >
              +
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
            <button
              type="button"
              className="border-0 rounded-[var(--radius-sm)] px-3.5 py-2.5 cursor-pointer font-semibold bg-[var(--color-primary-soft)] text-[var(--color-secondary)] border border-[var(--color-border-strong)]"
              onClick={closeModal}
            >
              {t("common.cancel", language)}
            </button>
            <button
              type="button"
              className="border-0 rounded-[var(--radius-sm)] px-3.5 py-2.5 cursor-pointer font-semibold text-[var(--color-text-on-accent)] [background:linear-gradient(135deg,var(--color-primary),var(--color-primary-strong))]"
              onClick={commitSelection}
            >
              {t("timePicker.confirm", language)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
