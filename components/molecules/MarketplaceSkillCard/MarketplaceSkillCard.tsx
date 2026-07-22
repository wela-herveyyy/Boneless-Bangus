import React from "react";
import { HiOutlineCheck } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import type { Skill } from "@/components/organisms/SkillsMarketplaceSidebar/skillsMarketplaceSidebar.hooks";

interface Props {
  skill: Skill;
  onClick: () => void;
  onToggleInstall: (id: string) => void;
  onDeleteSkill: (id: string) => void;
}

export function MarketplaceSkillCard({ skill, onClick, onToggleInstall, onDeleteSkill }: Props) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high ghost-border"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-on-surface">{skill.name}</h3>
        {skill.isAuthor && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${skill.isGlobal ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-muted'}`}>
            {skill.isGlobal ? 'Published' : 'Private'}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-on-surface-muted">{skill.description}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted">
          {skill.isAuthor ? 'by You' : `by ${skill.author}`}
        </span>
        {!skill.isAuthor && (
          <Button
            variant={skill.isInstalled ? "secondary" : "primary"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleInstall(skill.id);
          }}
          className="px-3 py-1 text-xs"
        >
          {skill.isInstalled ? (
            <>
              Uninstall
            </>
          ) : (
            "Install"
          )}
        </Button>
        )}
        {skill.isAuthor && (
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSkill(skill.id);
            }}
            className="px-3 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            Delete Skill
          </Button>
        )}
      </div>
    </div>
  );
}
