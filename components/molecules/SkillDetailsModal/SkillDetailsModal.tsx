"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Modal } from "@/components/molecules/Modal/Modal";
import type { Skill } from "@/components/organisms/SkillsMarketplaceSidebar/skillsMarketplaceSidebar.hooks";

type Props = {
  skill: Skill | null;
  onClose: () => void;
  onToggleInstall?: (id: string) => void;
  onDeleteSkill?: (id: string) => void;
};

export function SkillDetailsModal({ skill, onClose, onToggleInstall, onDeleteSkill }: Props) {
  return (
    <Modal
      isOpen={Boolean(skill)}
      onClose={onClose}
      title={
        skill ? (
          <span className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-primary">
              {skill.category}
            </span>
            <span className="mt-1 block font-display text-2xl font-semibold text-on-surface">
              {skill.name}
            </span>
          </span>
        ) : (
          "Skill"
        )
      }
      footer={
        skill && (onToggleInstall || onDeleteSkill) ? (
          <>
            {onToggleInstall && !skill.isAuthor ? (
              <Button
                variant={skill.isInstalled ? "secondary" : "primary"}
                onClick={() => onToggleInstall(skill.id)}
                className="w-full px-5 py-2 text-sm sm:w-auto"
              >
                {skill.isInstalled ? "Uninstall" : "Install Skill"}
              </Button>
            ) : null}
            {onDeleteSkill && skill.isAuthor ? (
              <Button
                variant="danger"
                onClick={() => onDeleteSkill(skill.id)}
                className="w-full px-5 py-2 text-sm sm:w-auto"
              >
                Delete Skill
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      {skill ? (
        <div className="space-y-4 text-sm text-on-surface">
          <div>
            <span className="mb-1 block font-semibold text-primary">Description</span>
            <p className="leading-relaxed text-on-surface-muted">{skill.description}</p>
          </div>
          <div>
            <span className="mb-1 block font-semibold text-primary">Instructions</span>
            <p className="bbai-scroll max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-surface-container-low p-3 leading-relaxed text-on-surface-muted">
              {skill.instructions}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-on-surface-muted">
            <div className="flex items-center gap-2">
              <span className="font-medium text-on-surface">Author:</span> {skill.author}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-on-surface">Visibility:</span>
              <span
                className={[
                  "rounded-md px-2 py-0.5 font-medium",
                  skill.isGlobal
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-container-highest text-on-surface-muted",
                ].join(" ")}
              >
                {skill.isGlobal ? "Published" : "Private"}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
