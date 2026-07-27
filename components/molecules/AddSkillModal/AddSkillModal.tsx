import React from "react";
import { HiXMark, HiOutlineGlobeAlt, HiOutlineLockClosed } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  newSkillForm: { name: string; description: string; instructions: string; category: string; isGlobal: boolean };
  setNewSkillForm: (form: { name: string; description: string; instructions: string; category: string; isGlobal: boolean }) => void;
  onSubmit: () => void;
  disabled: boolean;
  title?: string;
}

export function AddSkillModal({ isOpen, onClose, newSkillForm, setNewSkillForm, onSubmit, disabled, title = "Add New Skill" }: Props) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-140 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
        <div
          className="ghost-border flex w-full max-w-md flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-skill-title"
        >
          <div className="flex items-start justify-between">
            <h3 id="add-skill-title" className="font-display text-xl font-semibold text-primary">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
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
              <span className="text-sm font-medium text-on-surface">Short Description</span>
              <textarea
                placeholder="Brief summary of the skill..."
                value={newSkillForm.description}
                onChange={(e) => setNewSkillForm({ ...newSkillForm, description: e.target.value })}
                className="input-glow min-h-20 w-full resize-y rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest placeholder:text-on-surface-muted"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-on-surface">Instructions / Prompt</span>
              <textarea
                placeholder="You are an expert at..."
                value={newSkillForm.instructions}
                onChange={(e) => setNewSkillForm({ ...newSkillForm, instructions: e.target.value })}
                className="input-glow min-h-50 w-full resize-y rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container-lowest placeholder:text-on-surface-muted"
              />
            </label>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-on-surface">Visibility</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewSkillForm({ ...newSkillForm, isGlobal: false })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${!newSkillForm.isGlobal
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-on-surface/10 bg-surface-container-low text-on-surface-muted hover:border-on-surface/20"
                    }`}
                >
                  <HiOutlineLockClosed className="size-5" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">Private</span>
                    <span className="text-[10px] opacity-80 mt-1">Only you can use this</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setNewSkillForm({ ...newSkillForm, isGlobal: true })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 transition-colors ${newSkillForm.isGlobal
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-on-surface/10 bg-surface-container-low text-on-surface-muted hover:border-on-surface/20"
                    }`}
                >
                  <HiOutlineGlobeAlt className="size-5" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">Published</span>
                    <span className="text-[10px] opacity-80 mt-1">Available in marketplace</span>
                  </div>
                </button>
              </div>
            </div>
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
    </Portal>
  );
}
