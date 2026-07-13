"use client";

import { useState, useCallback, useEffect } from "react";
import { getSkillsAction, createSkillAction } from "@/lib/domain/actions/skills.actions";
import { 
  saveLocalRecordAction, 
  listLocalRecordsAction, 
  deleteLocalRecordAction 
} from "@/lib/domain/actions/storage.actions";
export type Skill = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  installed: boolean;
  localId?: number;
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
  newSkillForm: { name: string; description: string; category: string };
  setNewSkillForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; category: string }>>;
  handleAddSkill: () => Promise<void>;
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  selectedSkill: Skill | null;
  skillToUninstall: string | null;
  confirmUninstall: () => Promise<void>;
  cancelUninstall: () => void;
}

export function useSkillsMarketplaceSidebar(): UseSkillsMarketplaceSidebarReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAddingFormOpen, setIsAddingFormOpen] = useState(false);
  const [newSkillForm, setNewSkillForm] = useState({ name: "", description: "", category: "" });
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillToUninstall, setSkillToUninstall] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(skills.map((s) => s.category)))];

  const loadData = useCallback(async () => {
    const [skillsRes, localRes] = await Promise.all([
      getSkillsAction(),
      listLocalRecordsAction()
    ]);

    if (skillsRes.ok && skillsRes.data && localRes.ok && localRes.data) {
      const localRecordsMap = new Map<string, number>();
      localRes.data.forEach(record => {
        if (record.key.startsWith("installed-skill-")) {
          const skillId = record.key.replace("installed-skill-", "");
          localRecordsMap.set(skillId, record.id);
        }
      });

      const mappedSkills: Skill[] = skillsRes.data.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        author: s.author.name,
        category: s.category.name,
        installed: localRecordsMap.has(s.id),
        localId: localRecordsMap.get(s.id)
      }));
      setSkills(mappedSkills);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || skill.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleInstall = async (id: string) => {
    const targetSkill = skills.find((s) => s.id === id);
    if (!targetSkill) return;

    if (targetSkill.installed && targetSkill.localId) {
      setSkillToUninstall(targetSkill.id);
      return;
    }

    const payload = JSON.stringify({
      id: targetSkill.id,
      name: targetSkill.name,
      installedAt: new Date().toISOString()
    });

    const res = await saveLocalRecordAction({
      key: `installed-skill-${targetSkill.id}`,
      value: payload,
    });
    if (res.ok) {
      await loadData();
    } else {
      console.error(res.error);
    }
  };

  const confirmUninstall = async () => {
    if (!skillToUninstall) return;
    const targetSkill = skills.find((s) => s.id === skillToUninstall);
    if (targetSkill && targetSkill.localId) {
      const res = await deleteLocalRecordAction({ id: targetSkill.localId });
      if (res.ok) {
        setSkillToUninstall(null);
        await loadData();
      } else {
        console.error(res.error);
      }
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
      categoryName: newSkillForm.category.trim()
    });

    if (res.ok) {
      await loadData(); // refresh the list
      setNewSkillForm({ name: "", description: "", category: "" });
      setIsAddingFormOpen(false);
    } else {
      console.error(res.error);
    }
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
  };
}
