import React from "react";
import { HiXMark } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newSkillForm: { name: string; description: string; category: string };
  setNewSkillForm: (form: { name: string; description: string; category: string }) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function AddSkillModal({ isOpen, onClose, newSkillForm, setNewSkillForm, onSubmit, disabled }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
      <div
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-skill-title"
      >
        <div className="flex items-start justify-between">
          <h3 id="add-skill-title" className="font-display text-xl font-semibold text-primary">
            Add New Skill
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Close modal"
          >
            <HiXMark className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-on-surface">Skill Name</span>
            <Input
              type="text"
              placeholder="e.g. Advanced Search"
              value={newSkillForm.name}
              onChange={(e) => setNewSkillForm({ ...newSkillForm, name: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-on-surface">Category</span>
            <Input
              type="text"
              placeholder="e.g. Frontend"
              value={newSkillForm.category}
              onChange={(e) => setNewSkillForm({ ...newSkillForm, category: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-on-surface">Description</span>
            <textarea
              placeholder="What does this skill do?"
              value={newSkillForm.description}
              onChange={(e) => setNewSkillForm({ ...newSkillForm, description: e.target.value })}
              className="input-glow min-h-[300px] w-full resize-y rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest placeholder:text-on-surface-muted"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="px-5 py-2 text-sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={disabled} className="px-5 py-2 text-sm">
            Save Skill
          </Button>
        </div>
      </div>
    </div>
  );
}
