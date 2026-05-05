import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
    <div
      className="fixed inset-0 grid place-items-center bg-[var(--color-overlay)] p-4 z-[1100] overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        className={[
          "w-full max-w-[420px] bg-[var(--color-bg-surface)]",
          "border border-[var(--color-border-default)] rounded-[14px]",
          "shadow-[var(--shadow-modal)] p-4",
          "max-h-[calc(100vh-32px)] overflow-y-auto",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h3 className="m-0 mb-3 text-[1.02rem] text-[var(--color-text-primary)]">
            {title}
          </h3>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
