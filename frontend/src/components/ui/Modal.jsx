import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  className = "",
  closeOnBackdrop = true,
  children,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  function handleBackdropClick() {
    if (closeOnBackdrop) onClose?.();
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className={`modal-card ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? <h3 className="modal-title">{title}</h3> : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
