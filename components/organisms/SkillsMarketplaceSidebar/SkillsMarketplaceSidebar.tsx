"use client";

import { HiOutlinePlus, HiOutlineCubeTransparent } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { useSkillsMarketplaceSidebar } from "./skillsMarketplaceSidebar.hooks";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { AddSkillModal } from "@/components/molecules/AddSkillModal/AddSkillModal";
import { SkillDetailsModal } from "@/components/molecules/SkillDetailsModal/SkillDetailsModal";
import { UninstallSkillModal } from "@/components/molecules/UninstallSkillModal/UninstallSkillModal";
import { DeleteSkillModal } from "@/components/molecules/DeleteSkillModal/DeleteSkillModal";
import { InstallSkillModal } from "@/components/molecules/InstallSkillModal/InstallSkillModal";
import { MarketplaceSkillCard } from "@/components/molecules/MarketplaceSkillCard/MarketplaceSkillCard";
import { useEffect } from "react";

export function SkillsMarketplaceSidebar({ topOffset }: { topOffset?: string } = {}) {
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    filteredSkills,
    toggleInstall,
    isAddingFormOpen,
    setIsAddingFormOpen,
    newSkillForm,
    setNewSkillForm,
    handleAddSkill,
    selectedSkillId,
    setSelectedSkillId,
    selectedSkill,
    skillToUninstall,
    confirmUninstall,
    cancelUninstall,
    handleDeleteSkill,
    skillToDelete,
    confirmDelete,
    cancelDelete,
    skillToInstall,
    confirmInstall,
    cancelInstall,
    loadData,
  } = useSkillsMarketplaceSidebar();

  const sidebar = useRightSidebar("skills", {
    bodyClass: "bbai-skills-sidebar-open",
    onClose: () => {
      if (selectedSkillId) setSelectedSkillId(null);
      if (isAddingFormOpen) setIsAddingFormOpen(false);
    },
    onEscape: () => {
      if (skillToUninstall) {
        cancelUninstall();
        return true;
      }
      if (skillToDelete) {
        cancelDelete();
        return true;
      }
      if (skillToInstall) {
        cancelInstall();
        return true;
      }
      if (selectedSkillId) {
        setSelectedSkillId(null);
        return true;
      }
      if (isAddingFormOpen) {
        setIsAddingFormOpen(false);
        return true;
      }
      return false;
    },
  });

  useEffect(() => {
    if (sidebar.isOpen) {
      loadData();
    }
  }, [sidebar.isOpen, loadData]);

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<HiOutlineCubeTransparent className="size-6" aria-hidden />}
        labelOpen="Hide skills marketplace"
        labelClosed="Show skills marketplace"
        topOffset={topOffset}
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="skills-marketplace-panel">
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle="Skills Marketplace"
          title="Explore Skills for Automation"
          closeLabel="Close skills marketplace"
        />

        <RightSidebarContent className="skills-marketplace-content">
          <div className="space-y-3">
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search skills..."
              aria-label="Search skills"
            />
            <Button
              variant="primary"
              onClick={() => setIsAddingFormOpen(true)}
              className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm"
            >
              <HiOutlinePlus className="size-4" aria-hidden />
              Add Your Own Skill
            </Button>
            <div className="flex gap-2 overflow-x-auto pb-1 bbai-scroll">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={[
                    "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ghost-border",
                    activeCategory === category
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-muted hover:bg-surface-container-highest hover:text-on-surface",
                  ].join(" ")}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-primary/10 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">Available Skills</p>
            <div className="mt-2 flex flex-col gap-3">
              {filteredSkills.map((skill) => (
                <MarketplaceSkillCard
                  key={skill.id}
                  skill={skill}
                  onClick={() => setSelectedSkillId(skill.id)}
                  onToggleInstall={toggleInstall}
                  onDeleteSkill={handleDeleteSkill}
                />
              ))}
              {filteredSkills.length === 0 && (
                <p className="py-4 text-center text-sm text-on-surface-muted">No skills found.</p>
              )}
            </div>
          </div>
        </RightSidebarContent>
      </RightSidebarPanel>

      <AddSkillModal
        isOpen={isAddingFormOpen}
        onClose={() => setIsAddingFormOpen(false)}
        newSkillForm={newSkillForm}
        setNewSkillForm={setNewSkillForm}
        onSubmit={handleAddSkill}
        disabled={!newSkillForm.name.trim() || !newSkillForm.description.trim() || !newSkillForm.instructions.trim() || !newSkillForm.category.trim()}
      />

      <SkillDetailsModal
        skill={selectedSkill}
        onClose={() => setSelectedSkillId(null)}
        onToggleInstall={toggleInstall}
        onDeleteSkill={handleDeleteSkill}
      />

      <UninstallSkillModal
        isOpen={!!skillToUninstall}
        onCancel={cancelUninstall}
        onConfirm={confirmUninstall}
      />

      <DeleteSkillModal
        isOpen={!!skillToDelete}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      <InstallSkillModal
        isOpen={!!skillToInstall}
        onCancel={cancelInstall}
        onConfirm={confirmInstall}
      />
    </>
  );
}
