"use client";

import { HiOutlineGlobeAlt, HiOutlineLockClosed } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Modal } from "@/components/molecules/Modal/Modal";

type SkillForm = {
  name: string;
  description: string;
  instructions: string;
  category: string;
  isGlobal: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  newSkillForm: SkillForm;
  setNewSkillForm: (form: SkillForm) => void;
  onSubmit: () => void;
  disabled: boolean;
  title?: string;
};

export function AddSkillModal({
  isOpen,
  onClose,
  newSkillForm,
  setNewSkillForm,
  onSubmit,
  disabled,
  title = "Add New Skill",
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="px-5 py-2 text-sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={disabled} className="px-5 py-2 text-sm">
            Save Skill
          </Button>
        </>
      }
    >
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
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl p-3 transition-colors",
                !newSkillForm.isGlobal
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
              ].join(" ")}
            >
              <HiOutlineLockClosed className="size-5" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium leading-none">Private</span>
                <span className="mt-1 text-[10px] opacity-80">Only you can use this</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setNewSkillForm({ ...newSkillForm, isGlobal: true })}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl p-3 transition-colors",
                newSkillForm.isGlobal
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
              ].join(" ")}
            >
              <HiOutlineGlobeAlt className="size-5" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium leading-none">Published</span>
                <span className="mt-1 text-[10px] opacity-80">Available in marketplace</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
