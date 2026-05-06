import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { t } from "../../lib/i18n";

export default function NoteFormModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  textValue,
  onTextChange,
  language,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t("notes.edit", language) : t("notes.add", language)}
    >
      <form className="grid gap-2.5" onSubmit={onSubmit}>
          <textarea
            className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-[var(--color-text-primary)] min-h-[140px] resize-y"
          placeholder={t("notes.notePlaceholder", language)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          required
        />
        <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
          <Button type="button" variant="secondary" onClick={onClose} className="max-[720px]:flex-1">
            {t("common.cancel", language)}
          </Button>
          <Button type="submit" className="max-[720px]:flex-1">
            {isEditing ? t("notes.edit", language) : t("notes.add", language)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
