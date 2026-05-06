import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import TimePicker from "../../components/ui/TimePicker";
import { t } from "../../lib/i18n";

const INPUT_BASE_CLASSES = [
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)]",
  "bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)]",
  "focus:outline-[2px] focus:outline-[color-mix(in_srgb,var(--color-primary)_34%,transparent)]",
  "focus:border-[var(--color-primary)]",
  "disabled:bg-[color-mix(in_srgb,var(--color-bg-surface-soft)_82%,var(--color-bg-page))]",
  "disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed",
].join(" ");

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  textValue,
  onTextChange,
  alarmEnabled,
  onToggleAlarm,
  alarmTime,
  onChangeAlarmTime,
  language,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? t("dailyTasks.editTask", language)
          : t("dailyTasks.add", language)
      }
    >
      <form className="grid gap-2.5" onSubmit={onSubmit}>
        <input
          className={INPUT_BASE_CLASSES}
          placeholder={t("dailyTasks.taskPlaceholder", language)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          required
        />
        <label className="inline-flex items-center gap-1.5 text-text-secondary text-[0.9rem]">
          <input
            type="checkbox"
            checked={alarmEnabled}
            onChange={(event) => onToggleAlarm(event.target.checked)}
          />
          {t("dailyTasks.enableAlarm", language)}
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
              ? t("dailyTasks.saveTaskChanges", language)
              : t("dailyTasks.createTask", language)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
