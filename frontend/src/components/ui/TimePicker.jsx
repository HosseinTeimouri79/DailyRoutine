import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { t } from "../../lib/i18n";
import "./TimePicker.css";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseTime(value, fallback = "09:00") {
  const raw = typeof value === "string" && value.includes(":") ? value : fallback;
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
  const options = [];
  for (let i = 0; i < 12; i += 1) {
    const value = i === 0 ? 12 : i;
    options.push({
      value,
      label: pad2(value),
      ring: "outer",
      pos: i,
    });
  }

  if (!use24) {
    return options;
  }

  const innerOptions = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const pos = display % 12;
    const ring = hour >= 13 || hour === 0 ? "inner" : "outer";
    const label = pad2(hour);
    innerOptions.push({
      value: hour,
      label,
      ring,
      pos,
    });
  }

  return innerOptions;
}

function buildMinuteOptions() {
  return Array.from({ length: 12 }, (_item, index) => ({
    value: index * 5,
    label: pad2(index * 5),
    pos: index,
  }));
}

function getHourFromDisplay(hour12, isPm) {
  if (isPm) {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
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
  const handAngle = mode === "hour"
    ? (is24 ? ((hour % 12) / 12) * 360 : ((displayHour % 12) / 12) * 360)
    : (minute / 60) * 360;
  const handIsInner = mode === "hour" && is24 && (hour >= 13 || hour === 0);

  return (
    <div className={`field time-picker-field ${className}`.trim()}>
      {label ? <label>{label}</label> : null}
      <input
        className="input time-picker-input"
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
        <div className="time-picker-modal">
          <div className="time-picker-header">
            <div className="time-picker-display">
              {formatTimeLabel(hour, minute, is24, language)}
            </div>
            <div className="time-picker-format-toggle">
              <button
                type="button"
                className={`time-picker-chip ${!is24 ? "active" : ""}`.trim()}
                onClick={() => setIs24(false)}
              >
                {t("timePicker.format12", language)}
              </button>
              <button
                type="button"
                className={`time-picker-chip ${is24 ? "active" : ""}`.trim()}
                onClick={() => setIs24(true)}
              >
                {t("timePicker.format24", language)}
              </button>
            </div>
          </div>

          {!is24 ? (
            <div className="time-picker-meridiem">
              <button
                type="button"
                className={`time-picker-chip ${!isPm ? "active" : ""}`.trim()}
                onClick={() => handleToggleMeridiem(false)}
              >
                {t("timePicker.am", language)}
              </button>
              <button
                type="button"
                className={`time-picker-chip ${isPm ? "active" : ""}`.trim()}
                onClick={() => handleToggleMeridiem(true)}
              >
                {t("timePicker.pm", language)}
              </button>
            </div>
          ) : null}

          <div className="time-picker-tabs">
            <button
              type="button"
              className={`time-picker-tab ${mode === "hour" ? "active" : ""}`.trim()}
              onClick={() => setMode("hour")}
            >
              {t("timePicker.hour", language)}
            </button>
            <button
              type="button"
              className={`time-picker-tab ${mode === "minute" ? "active" : ""}`.trim()}
              onClick={() => setMode("minute")}
            >
              {t("timePicker.minute", language)}
            </button>
          </div>

          <div className="time-picker-face">
            <div
              className={`time-picker-hand ${handIsInner ? "inner" : ""}`.trim()}
              style={{ "--rotation": `${handAngle}deg` }}
            />
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
                  className={`time-picker-number ${option.ring === "inner" ? "inner" : ""} ${isSelected ? "selected" : ""}`.trim()}
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

          <div className="time-picker-minute-adjust">
            <button type="button" onClick={() => adjustMinute(-1)}>
              -
            </button>
            <span>{pad2(minute)}</span>
            <button type="button" onClick={() => adjustMinute(1)}>
              +
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              {t("common.cancel", language)}
            </button>
            <button type="button" className="btn" onClick={commitSelection}>
              {t("timePicker.confirm", language)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
