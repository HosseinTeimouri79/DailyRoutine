import "./Modal.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  className = "",
  closeOnBackdrop = true,
  children,
}) {
  if (!isOpen) return null;

  function handleBackdropClick() {
    if (closeOnBackdrop) onClose?.();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className={`modal-card ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h3 className="modal-title">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
