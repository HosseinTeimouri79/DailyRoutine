import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import TimePicker from "../../components/ui/TimePicker";
import { t } from "../../lib/i18n";

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
      <form className="stack" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder={t("dailyTasks.taskPlaceholder", language)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          required
        />
        <label className="routine-alarm-toggle">
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
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel", language)}
          </Button>
          <Button type="submit">
            {isEditing
              ? t("dailyTasks.saveTaskChanges", language)
              : t("dailyTasks.createTask", language)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
