"use client";

import { HiOutlinePlus, HiXMark, HiOutlineCubeTransparent, HiOutlineCheck } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { useSkillsMarketplaceSidebar } from "./skillsMarketplaceSidebar.hooks";

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
                <div
                  key={skill.id}
                  className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high ghost-border"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium text-on-surface">{skill.name}</h3>
                  </div>
                  <p className="text-xs text-on-surface-muted leading-relaxed">{skill.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-muted">by {skill.author}</span>
                    <Button
                      variant={skill.installed ? "secondary" : "primary"}
                      onClick={() => toggleInstall(skill.id)}
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
              ))}
              {filteredSkills.length === 0 && (
                <p className="py-4 text-center text-sm text-on-surface-muted">No skills found.</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Add Custom Skill Modal */}
      {isAddingFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-md flex flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border"
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
                onClick={() => setIsAddingFormOpen(false)}
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
                <span className="text-sm font-medium text-on-surface">Description</span>
                <Input
                  type="text"
                  placeholder="What does this skill do?"
                  value={newSkillForm.description}
                  onChange={(e) => setNewSkillForm({ ...newSkillForm, description: e.target.value })}
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsAddingFormOpen(false)} className="px-5 py-2 text-sm">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddSkill}
                disabled={!newSkillForm.name.trim() || !newSkillForm.description.trim()}
                className="px-5 py-2 text-sm"
              >
                Save Skill
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
