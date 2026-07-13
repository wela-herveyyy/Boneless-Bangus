import React from "react";
import { HiOutlineCheck } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import type { Skill } from "@/components/organisms/SkillsMarketplaceSidebar/skillsMarketplaceSidebar.hooks";

interface Props {
  skill: Skill;
  onClick: () => void;
  onToggleInstall: (id: string) => void;
}

export function MarketplaceSkillCard({ skill, onClick, onToggleInstall }: Props) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high ghost-border"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-on-surface">{skill.name}</h3>
      </div>
      <p className="text-xs leading-relaxed text-on-surface-muted">{skill.description}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted">by {skill.author}</span>
        <Button
          variant={skill.installed ? "secondary" : "primary"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleInstall(skill.id);
          }}
          className="px-3 py-1 text-xs"
        >
          {skill.installed ? (
            <>
              <HiOutlineCheck className="mr-1 inline size-3" />
              Installed
            </>
          ) : (
            "Install"
          )}
        </Button>
      </div>
    </div>
  );
}
