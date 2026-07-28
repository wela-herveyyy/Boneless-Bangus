"use client";

import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function UninstallSkillModal({ isOpen, onCancel, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Uninstall skill?"
      message="This removes the skill from your active workspace. You can install it again later."
      confirmLabel="Uninstall"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
