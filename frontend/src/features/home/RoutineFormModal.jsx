import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import TimePicker from "../../components/ui/TimePicker";
import IconPickerModal from "../../components/ui/IconPickerModal";
import { t } from "../../lib/i18n";
import { RECURRENCE_MODES } from "../../lib/recurrence";

export default function RoutineFormModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  titleValue,
  onTitleChange,
  iconValue,
  colorValue,
  onChangeIcon,
  onChangeColor,
  recurrenceMode,
  onChangeRecurrenceMode,
  recurrenceWeekdayOptions,
  selectedWeekdays,
  onToggleWeekday,
  dayOfWeek,
  onChangeDayOfWeek,
  dayOfMonth,
  onChangeDayOfMonth,
  alarmEnabled,
  onToggleAlarm,
  alarmTime,
  onChangeAlarmTime,
  language,
}) {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isEditing
            ? t("weekly.editRoutine", language)
            : t("weekly.addRoutine", language)
        }
      >
        <form className="stack" onSubmit={onSubmit}>
          <input
            id="newRoutineTitle"
            className="input routine-title-input"
            placeholder={t("weekly.routineNamePlaceholder", language)}
            value={titleValue}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />
          <Button
            type="button"
            variant="secondary"
            className="routine-icon-picker-btn"
            onClick={() => setIsIconPickerOpen(true)}
          >
            <span
              className="routine-icon-picker-preview"
              style={{ color: colorValue }}
            >
              <i className={iconValue} aria-hidden="true" />
            </span>
            {t("calendarTab.importantDayIconSelect", language)}
          </Button>

          <label
            className="routine-field-label"
            htmlFor="routineRecurrenceMode"
          >
            {t("weekly.recurrenceMode", language)}
          </label>
          <select
            id="routineRecurrenceMode"
            className="input"
            value={recurrenceMode}
            onChange={(event) => onChangeRecurrenceMode(event.target.value)}
          >
            <option value={RECURRENCE_MODES.SPECIFIC_WEEKDAYS}>
              {t("weekly.recurrenceSpecificWeekdays", language)}
            </option>
            <option value={RECURRENCE_MODES.WEEKLY_DAY}>
              {t("weekly.recurrenceWeeklyDay", language)}
            </option>
            <option value={RECURRENCE_MODES.MONTHLY_DAY}>
              {t("weekly.recurrenceMonthlyDay", language)}
            </option>
          </select>

          {recurrenceMode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS ? (
            <div className="stack stack-tight">
              <span className="routine-field-label">
                {t("weekly.recurrenceDaysOfWeek", language)}
              </span>
              <div className="weekday-chip-grid">
                {recurrenceWeekdayOptions.map((option) => (
                  <label
                    key={`routine-weekday-${option.value}`}
                    className={`weekday-chip ${selectedWeekdays.includes(option.value) ? "active" : ""}`.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedWeekdays.includes(option.value)}
                      onChange={() => onToggleWeekday(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {recurrenceMode === RECURRENCE_MODES.WEEKLY_DAY ? (
            <div className="stack stack-tight">
              <label className="routine-field-label" htmlFor="routineDayOfWeek">
                {t("weekly.recurrenceDayOfWeek", language)}
              </label>
              <select
                id="routineDayOfWeek"
                className="input"
                value={dayOfWeek}
                onChange={(event) =>
                  onChangeDayOfWeek(Number(event.target.value))
                }
              >
                {recurrenceWeekdayOptions.map((option) => (
                  <option
                    key={`routine-weekly-day-${option.value}`}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {recurrenceMode === RECURRENCE_MODES.MONTHLY_DAY ? (
            <div className="stack stack-tight">
              <label
                className="routine-field-label"
                htmlFor="routineDayOfMonth"
              >
                {t("weekly.recurrenceDayOfMonth", language)}
              </label>
              <input
                id="routineDayOfMonth"
                type="number"
                min={1}
                max={31}
                className="input"
                value={dayOfMonth}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isNaN(next)) return;
                  onChangeDayOfMonth(Math.min(31, Math.max(1, next)));
                }}
              />
            </div>
          ) : null}

          <label className="routine-alarm-toggle">
            <input
              type="checkbox"
              checked={alarmEnabled}
              onChange={(event) => onToggleAlarm(event.target.checked)}
            />
            {t("weekly.enableAlarm", language)}
          </label>
          <TimePicker
            value={alarmTime}
            onChange={onChangeAlarmTime}
            disabled={!alarmEnabled}
            ariaLabel={t("common.alarmTime", language)}
            language={language}
            defaultFormat="24"
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("common.cancel", language)}
            </Button>
            <Button type="submit">
              {isEditing
                ? t("weekly.saveRoutineChanges", language)
                : t("weekly.createRoutine", language)}
            </Button>
          </div>
        </form>
      </Modal>

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        title={t("calendarTab.importantDayIconPickerTitle", language)}
        selectedIcon={iconValue}
        selectedColor={colorValue}
        onSelectIcon={onChangeIcon}
        onSelectColor={onChangeColor}
        onConfirm={() => setIsIconPickerOpen(false)}
        language={language}
      />
    </>
  );
}
