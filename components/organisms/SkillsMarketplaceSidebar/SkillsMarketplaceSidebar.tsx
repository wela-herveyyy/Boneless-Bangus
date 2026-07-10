"use client";

import { HiOutlinePlus, HiXMark, HiOutlineCubeTransparent } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { useSkillsMarketplaceSidebar } from "./skillsMarketplaceSidebar.hooks";
import { AddSkillModal } from "@/components/molecules/AddSkillModal/AddSkillModal";
import { SkillDetailsModal } from "@/components/molecules/SkillDetailsModal/SkillDetailsModal";
import { UninstallSkillModal } from "@/components/molecules/UninstallSkillModal/UninstallSkillModal";
import { MarketplaceSkillCard } from "@/components/molecules/MarketplaceSkillCard/MarketplaceSkillCard";

export function SkillsMarketplaceSidebar() {
  const {
    isOpen,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    categories,
    filteredSkills,
    toggleInstall,
    openFromHover,
    scheduleClose,
    togglePinned,
    closeSidebar,
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
  } = useSkillsMarketplaceSidebar();

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Hide skills marketplace" : "Show skills marketplace"}
        aria-expanded={isOpen}
        onClick={togglePinned}
        onMouseEnter={openFromHover}
        onMouseLeave={scheduleClose}
        className={[
          "skills-sidebar-trigger fixed top-[calc(50%+2rem)] z-120 flex items-center justify-center",
          "bg-surface-container-highest text-primary shadow-bloom ghost-border",
          "size-12 transition-[right,transform,background-color] duration-300 ease-out hover:bg-primary hover:text-on-primary",
          isOpen ? "right-[min(100vw-3rem,22rem)]" : "right-0",
        ].join(" ")}
      >
        <HiOutlineCubeTransparent className="size-6" aria-hidden />
      </button>

      <div
        className={[
          "skills-sidebar-backdrop fixed inset-0 z-110 bg-on-surface/20 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={closeSidebar}
        aria-hidden={!isOpen}
      />

      <aside
        onMouseEnter={openFromHover}
        onMouseLeave={scheduleClose}
        aria-hidden={!isOpen}
        className={[
          "skills-sidebar-panel fixed top-0 right-0 z-115 flex h-full w-[min(100vw-3rem,22rem)] flex-col",
          "bg-surface-container-lowest shadow-bloom ghost-border",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <header className="flex items-start justify-between gap-3 bg-surface-container-low p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">Skills Marketplace</p>
            <h2 className="font-display text-lg font-semibold text-primary">Explore Skills for Automation</h2>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="flex size-9 items-center justify-center bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Close skills marketplace"
          >
            <HiXMark className="size-5" />
          </button>
        </header>

        <div className="flex flex-col gap-5 overflow-y-auto p-5">
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
            <div className="flex gap-2 overflow-x-auto pb-1">
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
                />
              ))}
              {filteredSkills.length === 0 && (
                <p className="py-4 text-center text-sm text-on-surface-muted">No skills found.</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <AddSkillModal
        isOpen={isAddingFormOpen}
        onClose={() => setIsAddingFormOpen(false)}
        newSkillForm={newSkillForm}
        setNewSkillForm={setNewSkillForm}
        onSubmit={handleAddSkill}
        disabled={!newSkillForm.name.trim() || !newSkillForm.description.trim() || !newSkillForm.category.trim()}
      />

      <SkillDetailsModal
        skill={selectedSkill}
        onClose={() => setSelectedSkillId(null)}
        onToggleInstall={toggleInstall}
      />

      <UninstallSkillModal
        isOpen={!!skillToUninstall}
        onCancel={cancelUninstall}
        onConfirm={confirmUninstall}
      />
    </>
  );
}
