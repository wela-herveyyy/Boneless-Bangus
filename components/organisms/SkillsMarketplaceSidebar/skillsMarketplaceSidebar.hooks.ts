"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

export function useSkillsMarketplaceSidebar() {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAddingFormOpen, setIsAddingFormOpen] = useState(false);
  const [newSkillForm, setNewSkillForm] = useState({ name: "", description: "", category: "" });
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillToUninstall, setSkillToUninstall] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(skills.map((s) => s.category)))];

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = hoverOpen || pinnedOpen;

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

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      if (!pinnedOpen) setHoverOpen(false);
    }, 180);
  }, [clearCloseTimer, pinnedOpen]);

  const openFromHover = useCallback(() => {
    clearCloseTimer();
    setHoverOpen(true);
  }, [clearCloseTimer]);

  const togglePinned = useCallback(() => {
    setPinnedOpen((current) => {
      const next = !current;
      if (next) setHoverOpen(true);
      return next;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setPinnedOpen(false);
    setHoverOpen(false);
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSidebar, isOpen]);

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || skill.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleInstall = async (id: string) => {
    const skill = skills.find((s) => s.id === id);
    if (!skill) return;

    if (skill.installed && skill.localId) {
      setSkillToUninstall(id);
    } else {
      const res = await saveLocalRecordAction({
        key: `installed-skill-${id}`,
        value: JSON.stringify(skill),
      });
      if (res.ok && res.data) {
        setSkills(skills.map((s) => (s.id === id ? { ...s, installed: true, localId: res.data?.id } : s)));
      }
    }
  };

  const confirmUninstall = async () => {
    if (!skillToUninstall) return;
    const skill = skills.find((s) => s.id === skillToUninstall);
    if (!skill || !skill.localId) return;

    await deleteLocalRecordAction({ id: skill.localId });
    setSkills(skills.map((s) => (s.id === skillToUninstall ? { ...s, installed: false, localId: undefined } : s)));
    setSkillToUninstall(null);
  };

  const cancelUninstall = () => {
    setSkillToUninstall(null);
  };

  const handleAddSkill = async () => {
    if (!newSkillForm.name.trim() || !newSkillForm.description.trim() || !newSkillForm.category.trim()) return;
    
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
  };
}
