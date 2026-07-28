"use client";

import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";

type Props = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function InstallSkillModal({ isOpen, onCancel, onConfirm }: Props) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Install skill?"
      message="Install this skill into your workspace so it appears in slash commands."
      confirmLabel="Install"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
