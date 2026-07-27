import React from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Portal } from "@/components/atoms/Portal/Portal";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteSkillModal({ isOpen, onCancel, onConfirm }: Props) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-140 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
        <div
          className="ghost-border flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <h3 id="delete-title" className="font-display text-xl font-semibold text-red-500">
            Delete Skill?
          </h3>
          <p className="text-sm text-on-surface">
            Are you sure you want to permanently delete this skill? It will be removed from the
            database for everyone. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-sm">
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} className="px-4 py-2 text-sm">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
