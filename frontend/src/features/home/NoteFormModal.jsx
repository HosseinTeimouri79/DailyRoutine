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
      <form className="stack" onSubmit={onSubmit}>
        <textarea
          className="input note-form-textarea"
          placeholder={t("notes.notePlaceholder", language)}
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          required
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.cancel", language)}
          </Button>
          <Button type="submit">
            {isEditing ? t("notes.edit", language) : t("notes.add", language)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
