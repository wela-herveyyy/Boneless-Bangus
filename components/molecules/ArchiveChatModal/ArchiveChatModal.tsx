"use client";

import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ArchiveChatModal({ isOpen, onCancel, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Archive chat?"
      message="This conversation will leave your sidebar. You can still find it later if history supports it."
      confirmLabel="Archive"
      confirmVariant="danger"
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
