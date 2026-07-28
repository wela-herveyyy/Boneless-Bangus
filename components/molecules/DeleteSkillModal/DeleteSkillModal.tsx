"use client";

import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteSkillModal({ isOpen, onCancel, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Delete skill?"
      message="This permanently deletes the skill for everyone. This cannot be undone."
      confirmLabel="Delete"
      confirmVariant="danger"
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
