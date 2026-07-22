"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";
import { LuPlus, LuTrash2, LuPencil } from "react-icons/lu";
import { SkillDetailsModal } from "@/components/molecules/SkillDetailsModal/SkillDetailsModal";
import { DeleteSkillModal } from "@/components/molecules/DeleteSkillModal/DeleteSkillModal";
import { AddSkillModal } from "@/components/molecules/AddSkillModal/AddSkillModal";
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
  const [newSkillForm, setNewSkillForm] = useState({
    name: "",
    description: "",
    instructions: "",
    category: "",
    isGlobal: false
  });

  const loadData = async () => {
    setLoading(true);
    const [skillsRes, catsRes] = await Promise.all([
      getSkillsAction(),
      getSkillCategoriesAction()
    ]);
    if (skillsRes.ok) setSkills(skillsRes.data);
    if (catsRes.ok) {
      setCategories(catsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (skill?: SkillWithDetails) => {
    if (skill) {
      setEditingSkill(skill);
      setNewSkillForm({
        name: skill.name,
        description: skill.description,
        instructions: (skill as any).instructions || "",
        category: skill.category.name,
        isGlobal: skill.isGlobal ?? false,
      });
    } else {
      setEditingSkill(null);
      setNewSkillForm({ name: "", description: "", instructions: "", category: "", isGlobal: false });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSkill(null);
  };

  const handleSubmit = async () => {
    if (!newSkillForm.name.trim() || !newSkillForm.description.trim() || !newSkillForm.instructions.trim() || !newSkillForm.category.trim()) {
      return;
    }
    
    if (editingSkill) {
      await updateSkillAction({ 
        id: editingSkill.id, 
        name: newSkillForm.name, 
        description: newSkillForm.description, 
        instructions: newSkillForm.instructions, 
        categoryName: newSkillForm.category.trim(),
        isGlobal: newSkillForm.isGlobal
      });
    } else {
      await createSkillAction({ 
        name: newSkillForm.name, 
        description: newSkillForm.description, 
        instructions: newSkillForm.instructions, 
        categoryName: newSkillForm.category.trim(),
        isGlobal: newSkillForm.isGlobal
      });
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

      <Portal>
        <AddSkillModal
          isOpen={isFormOpen}
          onClose={closeForm}
          newSkillForm={newSkillForm}
          setNewSkillForm={setNewSkillForm}
          onSubmit={handleSubmit}
          disabled={!newSkillForm.name.trim() || !newSkillForm.description.trim() || !newSkillForm.instructions.trim() || !newSkillForm.category.trim()}
          title={editingSkill ? "Edit Skill" : "Add New Skill"}
        />
      </Portal>

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
              isInstalled: viewingSkill.isInstalled ?? false,
              isAuthor: viewingSkill.isAuthor ?? false,
              isGlobal: viewingSkill.isGlobal ?? false,
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
