import Modal from "./Modal";
import Button from "./Button";
import "./ConfirmModal.css";

export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  confirmVariant = "danger",
  className = "",
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className={`confirm-modal ${className}`.trim()}
    >
      {typeof message === "string" ? (
        <p className="muted confirm-modal-text">{message}</p>
      ) : (
        message
      )}
      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={confirmVariant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
