import React from "react";
import { Button } from "@/components/atoms/Button/Button";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UninstallSkillModal({ isOpen, onCancel, onConfirm }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
      <div
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="uninstall-title"
      >
        <h3 id="uninstall-title" className="font-display text-xl font-semibold text-primary">
          Uninstall Skill?
        </h3>
        <p className="text-sm text-on-surface">
          Are you sure you want to uninstall this skill? It will be removed from your active workspace.
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} className="px-4 py-2 text-sm">
            Uninstall
          </Button>
        </div>
      </div>
    </div>
  );
}
