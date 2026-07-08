"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  z,
  topAlign,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  z?: number;
  // Pin the sheet toward the top instead of vertically centering it.
  topAlign?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-backdrop${topAlign ? " modal-backdrop-top" : ""}`}
      onClick={onClose}
      style={z ? { zIndex: z } : undefined}
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <span className="modal-grabber" />
          <div className="row">
            {typeof title === "string" ? (
              <h2 style={{ margin: 0 }}>{title}</h2>
            ) : (
              <div style={{ margin: 0, flex: 1, minWidth: 0 }}>{title}</div>
            )}
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
