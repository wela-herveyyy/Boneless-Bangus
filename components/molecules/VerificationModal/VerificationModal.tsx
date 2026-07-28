import React from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Portal } from "@/components/atoms/Portal/Portal";

export interface VerificationModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: "primary" | "secondary" | "danger";
  titleColor?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function VerificationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  titleColor = "text-primary",
  onCancel,
  onConfirm,
}: VerificationModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-140 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
        <div
          className="ghost-border flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-title"
        >
          <h3 id="verification-title" className={`font-display text-xl font-semibold ${titleColor}`}>
            {title}
          </h3>
          <div className="text-sm text-on-surface">
            {message}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-sm">
              Cancel
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} className="px-4 py-2 text-sm">
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
