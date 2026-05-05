import Modal from "./Modal";
import Button from "./Button";

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
      className={`w-[min(420px,calc(100vw-24px))] ${className}`.trim()}
    >
      {typeof message === "string" ? (
        <p className="text-[var(--color-text-muted)] my-1 whitespace-normal leading-[1.7] mb-3.5 [overflow-wrap:anywhere] [word-break:break-word]">
          {message}
        </p>
      ) : (
        message
      )}
      <div className="flex justify-end gap-2 max-[720px]:flex-wrap max-[720px]:justify-stretch">
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
