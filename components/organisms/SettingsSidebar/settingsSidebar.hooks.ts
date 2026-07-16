import { useState, useCallback, useEffect } from "react";
import { useRightSidebar } from "@/components/molecules/RightSidebar/rightSidebar.hooks";
import { getSkillsAction } from "@/lib/domain/actions/skills.actions";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import type { SkillWithDetails } from "@/lib/entities/skills.type";
import type { McpDataPayload } from "@/lib/entities/mcp_server.type";

export type SettingsTab = "skills" | "mcp" | "integrations";

export function useSettingsSidebar() {
  const sidebar = useRightSidebar("bbai-settings-sidebar", {
    bodyClass: "right-sidebar-open",
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("skills");

  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      if (!sidebar.isOpen) {
        sidebar.togglePinned();
      }
      if (e instanceof CustomEvent && e.detail?.tab) {
        setActiveTab(e.detail.tab);
      } else if (e.type === "bbai:open-settings-integrations") {
        setActiveTab("integrations");
      }
    };

    window.addEventListener("bbai:open-settings", handleOpenEvent);
    window.addEventListener("bbai:open-settings-integrations", handleOpenEvent);
    return () => {
      window.removeEventListener("bbai:open-settings", handleOpenEvent);
      window.removeEventListener("bbai:open-settings-integrations", handleOpenEvent);
    };
  }, [sidebar]);

  return {
    ...sidebar,
    activeTab,
    setActiveTab,
  };
}
