import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import TimePicker from "../../components/ui/TimePicker";
import IconPickerModal from "../../components/ui/IconPickerModal";
import Dropdown from "../../components/ui/Dropdown";
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
        <form className="grid gap-2.5" onSubmit={onSubmit}>
          <Input
            id="newRoutineTitle"
            placeholder={t("weekly.routineNamePlaceholder", language)}
            value={titleValue}
            onChange={(event) => onTitleChange(event.target.value)}
            required
          />

          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-2 min-w-[140px]"
            onClick={() => setIsIconPickerOpen(true)}
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--color-bg-surface)_80%,transparent)]"
              style={{ color: colorValue }}
            >
              <i className={iconValue} aria-hidden="true" />
            </span>
            {t("calendarTab.importantDayIconSelect", language)}
          </Button>

          <div className="grid gap-1.5 w-full">
            <label
              className="text-[0.86rem] text-text-secondary font-semibold"
              htmlFor="routineRecurrenceMode"
            >
              {t("weekly.recurrenceMode", language)}
            </label>
            <Dropdown
              id="routineRecurrenceMode"
              className="w-full"
              value={recurrenceMode}
              onChange={(nextValue) => onChangeRecurrenceMode(nextValue)}
              options={[
                {
                  value: RECURRENCE_MODES.SPECIFIC_WEEKDAYS,
                  label: t("weekly.recurrenceSpecificWeekdays", language),
                },
                {
                  value: RECURRENCE_MODES.WEEKLY_DAY,
                  label: t("weekly.recurrenceWeeklyDay", language),
                },
                {
                  value: RECURRENCE_MODES.MONTHLY_DAY,
                  label: t("weekly.recurrenceMonthlyDay", language),
                },
              ]}
            />
          </div>

          {recurrenceMode === RECURRENCE_MODES.SPECIFIC_WEEKDAYS ? (
            <div className="grid gap-2">
              <span className="text-[0.86rem] text-text-secondary font-semibold">
                {t("weekly.recurrenceDaysOfWeek", language)}
              </span>
              <div className="grid grid-cols-3 gap-2 max-[720px]:grid-cols-2">
                {recurrenceWeekdayOptions.map((option) => (
                  <label
                    key={`routine-weekday-${option.value}`}
                    className={[
                      "inline-flex items-center justify-center gap-1.5 border border-border-default",
                      "rounded-sm bg-surface-soft text-text-secondary px-2.5 py-2 cursor-pointer",
                      "text-[0.82rem] select-none",
                      selectedWeekdays.includes(option.value)
                        ? "text-primary border-border-accent bg-[color-mix(in_srgb,var(--color-primary-soft)_65%,transparent)]"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
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
            <div className="grid gap-1.5 w-full">
              <label
                className="text-[0.86rem] text-text-secondary font-semibold"
                htmlFor="routineDayOfWeek"
              >
                {t("weekly.recurrenceDayOfWeek", language)}
              </label>
              <Dropdown
                id="routineDayOfWeek"
                className="w-full"
                value={dayOfWeek}
                onChange={(nextValue) => onChangeDayOfWeek(Number(nextValue))}
                options={recurrenceWeekdayOptions}
              />
            </div>
          ) : null}

          {recurrenceMode === RECURRENCE_MODES.MONTHLY_DAY ? (
            <Input
              id="routineDayOfMonth"
              label={t("weekly.recurrenceDayOfMonth", language)}
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) return;
                onChangeDayOfMonth(Math.min(31, Math.max(1, next)));
              }}
            />
          ) : null}

          <label className="inline-flex items-center gap-1.5 text-text-secondary text-[0.9rem]">
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

          <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="max-[720px]:flex-1"
            >
              {t("common.cancel", language)}
            </Button>
            <Button type="submit" className="max-[720px]:flex-1">
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
