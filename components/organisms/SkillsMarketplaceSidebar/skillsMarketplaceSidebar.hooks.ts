"use client";

import { useState, useCallback, useEffect } from "react";
import { getSkillsAction, createSkillAction } from "@/lib/domain/actions/skills.actions";
import { installSkillAction, uninstallSkillAction, deleteSkillAction } from "@/lib/domain/actions/skills.actions";
export type Skill = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  author: string;
  category: string;
  isInstalled: boolean;
  isAuthor: boolean;
  isGlobal: boolean;
};

export interface UseSkillsMarketplaceSidebarReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  categories: string[];
  filteredSkills: Skill[];
  toggleInstall: (id: string) => Promise<void>;
  isAddingFormOpen: boolean;
  setIsAddingFormOpen: (open: boolean) => void;
  newSkillForm: { name: string; description: string; instructions: string; category: string; isGlobal: boolean };
  setNewSkillForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; instructions: string; category: string; isGlobal: boolean }>>;
  handleAddSkill: () => Promise<void>;
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  selectedSkill: Skill | null;
  skillToUninstall: string | null;
  confirmUninstall: () => Promise<void>;
  cancelUninstall: () => void;
  handleDeleteSkill: (id: string) => void;
  skillToDelete: string | null;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  skillToInstall: string | null;
  confirmInstall: () => Promise<void>;
  cancelInstall: () => void;
  loadData: () => Promise<void>;
}

export function useSkillsMarketplaceSidebar(): UseSkillsMarketplaceSidebarReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAddingFormOpen, setIsAddingFormOpen] = useState(false);
  const [newSkillForm, setNewSkillForm] = useState({ name: "", description: "", instructions: "", category: "", isGlobal: false });
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillToUninstall, setSkillToUninstall] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [skillToInstall, setSkillToInstall] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(skills.map((s) => s.category)))];

  const loadData = useCallback(async () => {
    const skillsRes = await getSkillsAction();

    if (skillsRes.ok && skillsRes.data) {
      const mappedSkills: Skill[] = skillsRes.data.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        instructions: (s as any).instructions || "",
        author: s.author.name,
        category: s.category.name,
        isInstalled: !!s.isInstalled,
        isAuthor: !!s.isAuthor,
        isGlobal: !!s.isGlobal,
      }));
      setSkills(mappedSkills);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSkills = skills.filter((skill) => {
    // 1. Tab Filter: Marketplace only shows global skills
    if (!skill.isGlobal) return false;

    // 2. Search & Category Filter
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || skill.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleInstall = async (id: string) => {
    const targetSkill = skills.find((s) => s.id === id);
    if (!targetSkill) return;

    if (targetSkill.isAuthor) return; // Cannot install/uninstall your own skill

    if (targetSkill.isInstalled) {
      setSkillToUninstall(id);
    } else {
      setSkillToInstall(id);
    }
  };

  const confirmInstall = async () => {
    if (!skillToInstall) return;
    const res = await installSkillAction(skillToInstall);
    if (res.ok) {
      setSkillToInstall(null);
      await loadData();
    } else {
      console.error(res.error);
    }
  };

  const cancelInstall = () => {
    setSkillToInstall(null);
  };

  const confirmUninstall = async () => {
    if (!skillToUninstall) return;
    const res = await uninstallSkillAction(skillToUninstall);
    if (res.ok) {
      setSkillToUninstall(null);
      await loadData();
    } else {
      console.error(res.error);
    }
  };

  const cancelUninstall = () => {
    setSkillToUninstall(null);
  };

  const handleAddSkill = async () => {
    if (!newSkillForm.name.trim() || !newSkillForm.description.trim() || !newSkillForm.category.trim()) {
      return;
    }
    
    const res = await createSkillAction({
      name: newSkillForm.name,
      description: newSkillForm.description,
      instructions: newSkillForm.instructions,
      categoryName: newSkillForm.category.trim(),
      isGlobal: newSkillForm.isGlobal,
    });

    if (res.ok) {
      await loadData(); // refresh the list
      setNewSkillForm({ name: "", description: "", instructions: "", category: "", isGlobal: false });
      setIsAddingFormOpen(false);
    } else {
      console.error(res.error);
    }
  };

  const handleDeleteSkill = (id: string) => {
    setSkillToDelete(id);
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    const res = await deleteSkillAction(skillToDelete);
    if (res.ok) {
      if (selectedSkillId === skillToDelete) setSelectedSkillId(null);
      setSkillToDelete(null);
      await loadData();
    } else {
      console.error(res.error);
    }
  };

  const cancelDelete = () => {
    setSkillToDelete(null);
  };

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || null;

  return {
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
  };
}
