"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";
import { LuPlus, LuTrash2, LuPencil } from "react-icons/lu";
import { SkillDetailsModal } from "@/components/molecules/SkillDetailsModal/SkillDetailsModal";
import { DeleteSkillModal } from "@/components/molecules/DeleteSkillModal/DeleteSkillModal";
import { getSkillsAction, createSkillAction, updateSkillAction, deleteSkillAction, getSkillCategoriesAction } from "@/lib/domain/actions/skills.actions";
import type { SkillWithDetails, SkillCategorySelect } from "@/lib/entities/skills.type";

export function SkillsTab() {
  const [skills, setSkills] = useState<SkillWithDetails[]>([]);
  const [categories, setCategories] = useState<SkillCategorySelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState<SkillWithDetails | null>(null);
  const [viewingSkill, setViewingSkill] = useState<SkillWithDetails | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [instructions, setInstructions] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [skillsRes, catsRes] = await Promise.all([
      getSkillsAction(),
      getSkillCategoriesAction()
    ]);
    if (skillsRes.ok) setSkills(skillsRes.data);
    if (catsRes.ok) {
      setCategories(catsRes.data);
      if (catsRes.data.length > 0) {
        setCategoryId(catsRes.data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (skill?: SkillWithDetails) => {
    if (skill) {
      setEditingSkill(skill);
      setName(skill.name);
      setDescription(skill.description);
      // We assume skill.instructions exists since we updated the schema and types.
      // If the old skill lacks it, we fallback to "".
      setInstructions((skill as any).instructions || "");
      setCategoryId(skill.categoryId);
    } else {
      setEditingSkill(null);
      setName("");
      setDescription("");
      setInstructions("");
      if (categories.length > 0) setCategoryId(categories[0].id);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSkill(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSkill) {
      await updateSkillAction({ id: editingSkill.id, name, description, instructions, categoryId });
    } else {
      if (!categoryId) {
        alert("Please select a category");
        return;
      }
      const selectedCat = categories.find(c => c.id === categoryId);
      await createSkillAction({ name, description, instructions, categoryName: selectedCat ? selectedCat.name : "Uncategorized" });
    }
    await loadData();
    closeForm();
  };

  const handleDelete = (id: string) => {
    setSkillToDelete(id);
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    await deleteSkillAction(skillToDelete);
    await loadData();
    setSkillToDelete(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button variant="primary" onClick={() => openForm()} className="w-full flex items-center justify-center gap-2">
        <LuPlus /> Add Skill
      </Button>

      {isFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-xl font-semibold text-primary">{editingSkill ? "Edit Skill" : "Add Skill"}</h3>
              <button
                type="button"
                onClick={closeForm}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Skill Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Advanced Search" required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Category</span>
                <select
                  className="w-full rounded-2xl bg-surface-container-low p-3 text-sm text-on-surface ghost-border focus:bg-surface-container-lowest"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Short Description</span>
                <textarea
                  className="min-h-[80px] w-full resize-y rounded-xl bg-surface-container-low p-3 text-sm text-on-surface placeholder:text-on-surface-muted/60 ghost-border focus:bg-surface-container-lowest"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of the skill..."
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Instructions / Prompt</span>
                <textarea
                  className="min-h-[200px] w-full resize-y rounded-xl bg-surface-container-low p-3 text-sm text-on-surface placeholder:text-on-surface-muted/60 ghost-border focus:bg-surface-container-lowest"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="You are an expert at..."
                  required
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
              <Button variant="primary" type="submit">Save</Button>
            </div>
          </form>
        </div>
        </Portal>
      )}

      {loading ? (
        <p className="text-center text-sm text-on-surface-muted">Loading...</p>
      ) : skills.length === 0 ? (
        <p className="text-center text-sm text-on-surface-muted">No skills found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {skills.map((skill) => (
            <div 
              key={skill.id} 
              onClick={() => setViewingSkill(skill)}
              className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high ghost-border cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-on-surface">{skill.name}</h4>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openForm(skill); }} className="text-primary hover:bg-surface-container p-1.5 rounded-lg transition-colors">
                    <LuPencil className="size-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(skill.id); }} className="text-red-500 hover:bg-surface-container p-1.5 rounded-lg transition-colors">
                    <LuTrash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-on-surface-muted mt-1">{skill.description}</p>
            </div>
          ))}
        </div>
      )}

      {viewingSkill && (
        <Portal>
          <SkillDetailsModal
            skill={{
              id: viewingSkill.id,
              name: viewingSkill.name,
              description: viewingSkill.description,
              instructions: (viewingSkill as any).instructions || "",
              author: viewingSkill.author.name || "You",
              category: viewingSkill.category.name,
              installed: true
            }}
            onClose={() => setViewingSkill(null)}
          />
        </Portal>
      )}

      <Portal>
        <DeleteSkillModal
          isOpen={!!skillToDelete}
          onCancel={() => setSkillToDelete(null)}
          onConfirm={confirmDelete}
        />
      </Portal>
    </div>
  );
}
