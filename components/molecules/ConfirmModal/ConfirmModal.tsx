"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Modal } from "@/components/molecules/Modal/Modal";

export type ConfirmModalVariant = "primary" | "secondary" | "danger";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmModalVariant;
  /** Danger titles use secondary accent for destructive emphasis. */
  tone?: "default" | "danger";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  tone = "default",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const titleNode =
    typeof title === "string" ? (
      <span className={tone === "danger" ? "text-secondary" : "text-on-surface"}>{title}</span>
    ) : (
      title
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={titleNode}
      size="sm"
      showClose={false}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            className="px-4 py-2 text-sm"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className="px-4 py-2 text-sm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-on-surface-muted">{message}</div>
    </Modal>
  );
}
