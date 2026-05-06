import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import TimePicker from "../../components/ui/TimePicker";
import Checkbox from "../../components/ui/Checkbox";
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
      <form className="grid gap-2.5" onSubmit={onSubmit}>
        <Input
          placeholder={t("dailyTasks.taskPlaceholder", language)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          required
        />
        <Checkbox
          checked={alarmEnabled}
          onChange={(event) => onToggleAlarm(event.target.checked)}
          label={t("dailyTasks.enableAlarm", language)}
          className="text-text-secondary text-[0.9rem]"
        />
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
