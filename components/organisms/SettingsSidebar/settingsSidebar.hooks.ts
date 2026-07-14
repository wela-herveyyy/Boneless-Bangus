import { useState, useCallback, useEffect } from "react";
import { useRightSidebar } from "@/components/molecules/RightSidebar/rightSidebar.hooks";
import { getSkillsAction } from "@/lib/domain/actions/skills.actions";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import type { SkillWithDetails } from "@/lib/entities/skills.type";
import type { McpDataPayload } from "@/lib/entities/mcp_server.type";

export type SettingsTab = "skills" | "mcp";

export function useSettingsSidebar() {
  const sidebar = useRightSidebar("bbai-settings-sidebar", {
    bodyClass: "right-sidebar-open",
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("skills");

  useEffect(() => {
    const handleOpen = () => {
      sidebar.togglePinned();
    };

    const handleOpenEvent = () => {
      if (!sidebar.isOpen) {
        sidebar.togglePinned();
      }
    };

    window.addEventListener("bbai:open-settings", handleOpenEvent);
    return () => window.removeEventListener("bbai:open-settings", handleOpenEvent);
  }, [sidebar]);

  return {
    ...sidebar,
    activeTab,
    setActiveTab,
  };
}
