import React from "react";
import { HiXMark, HiOutlineCheck } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import type { Skill } from "@/components/organisms/SkillsMarketplaceSidebar/skillsMarketplaceSidebar.hooks";

interface Props {
  skill: Skill | null;
  onClose: () => void;
  onToggleInstall?: (id: string) => void;
  onDeleteSkill?: (id: string) => void;
}

export function SkillDetailsModal({ skill, onClose, onToggleInstall, onDeleteSkill }: Props) {
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
          <div>
            <span className="font-semibold text-primary block mb-1">Description</span>
            <p className="leading-relaxed text-on-surface-muted">{skill.description}</p>
          </div>
          <div>
            <span className="font-semibold text-primary block mb-1">Instructions</span>
            <p className="leading-relaxed bg-surface-container-low p-3 rounded-xl border border-primary/10 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {skill.instructions}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-on-surface-muted border-t border-primary/5 pt-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-on-surface">Author:</span> {skill.author}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-on-surface">Visibility:</span> 
              <span className={`px-2 py-0.5 rounded-md font-medium ${skill.isGlobal ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-muted'}`}>
                {skill.isGlobal ? 'Published' : 'Private'}
              </span>
            </div>
          </div>
        </div>

        {(onToggleInstall || onDeleteSkill) && (
          <div className="flex justify-end gap-3 border-t border-primary/10 pt-4">
            {onToggleInstall && !skill.isAuthor && (
              <Button
                variant={skill.isInstalled ? "secondary" : "primary"}
                onClick={() => onToggleInstall(skill.id)}
                className="w-full px-5 py-2 text-sm sm:w-auto"
              >
                {skill.isInstalled ? (
                  <>
                    Uninstall
                  </>
                ) : (
                  "Install Skill"
                )}
              </Button>
            )}
            
            {onDeleteSkill && skill.isAuthor && (
              <Button
                variant="secondary"
                onClick={() => onDeleteSkill(skill.id)}
                className="w-full px-5 py-2 text-sm sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                Delete Skill
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
