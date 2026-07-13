import React from "react";
import { HiXMark, HiOutlineCheck } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import type { Skill } from "@/components/organisms/SkillsMarketplaceSidebar/skillsMarketplaceSidebar.hooks";

interface Props {
  skill: Skill | null;
  onClose: () => void;
  onToggleInstall: (id: string) => void;
}

export function SkillDetailsModal({ skill, onClose, onToggleInstall }: Props) {
  if (!skill) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
      <div
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-details-title"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{skill.category}</span>
            <h3 id="skill-details-title" className="mt-1 font-display text-2xl font-semibold text-on-surface">
              {skill.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Close modal"
          >
            <HiXMark className="size-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-on-surface">
          <p className="leading-relaxed">{skill.description}</p>
          
          <div className="flex items-center gap-2 text-xs text-on-surface-muted">
            <span className="font-medium">Author:</span> {skill.author}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-primary/10 pt-4">
          <Button
            variant={skill.installed ? "secondary" : "primary"}
            onClick={() => onToggleInstall(skill.id)}
            className="w-full px-5 py-2 text-sm sm:w-auto"
          >
            {skill.installed ? (
              <>
                <HiOutlineCheck className="mr-2 inline size-4" />
                Installed
              </>
            ) : (
              "Install Skill"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
