"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type Skill = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  installed: boolean;
};

const MOCK_SKILLS: Skill[] = [
  {
    id: "s1",
    name: "React Advanced Patterns",
    description: "Expert-level hooks and context management.",
    author: "frontend-wizards",
    category: "Frontend",
    installed: false,
  },
  {
    id: "s2",
    name: "Figma to Code",
    description: "Generate components directly from Figma tokens.",
    author: "design-systems-inc",
    category: "Design",
    installed: true,
  },
  {
    id: "s3",
    name: "SQL Performance Tuning",
    description: "Optimize complex queries and indexes.",
    author: "db-masters",
    category: "Database",
    installed: false,
  },
];

export function useSkillsMarketplaceSidebar() {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [skills, setSkills] = useState<Skill[]>(MOCK_SKILLS);

  const [isAddingFormOpen, setIsAddingFormOpen] = useState(false);
  const [newSkillForm, setNewSkillForm] = useState({ name: "", description: "", category: "Custom" });

  const categories = ["All", ...Array.from(new Set(skills.map((s) => s.category)))];

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = hoverOpen || pinnedOpen;

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

  const toggleInstall = (id: string) => {
    setSkills(skills.map((s) => (s.id === id ? { ...s, installed: !s.installed } : s)));
  };

  const handleAddSkill = () => {
    if (!newSkillForm.name.trim() || !newSkillForm.description.trim()) return;
    
    const newSkill: Skill = {
      id: `custom-${Date.now()}`,
      name: newSkillForm.name,
      description: newSkillForm.description,
      category: newSkillForm.category || "Custom",
      author: "you",
      installed: true,
    };
    
    setSkills((prev) => [newSkill, ...prev]);
    setNewSkillForm({ name: "", description: "", category: "Custom" });
    setIsAddingFormOpen(false);
  };

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
  };
}
