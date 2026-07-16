"use client";

import { LuSettings } from "react-icons/lu";
import { useSettingsSidebar, type SettingsTab } from "./settingsSidebar.hooks";
import {
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { SkillsTab } from "./SkillsTab";
import { McpTab } from "./McpTab";
import { IntegrationsTab } from "./IntegrationsTab";

export function SettingsSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useSettingsSidebar();
  const { activeTab, setActiveTab, closeSidebar } = sidebar;

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<LuSettings className="size-6" aria-hidden />}
        labelOpen="Hide settings sidebar"
        labelClosed="Show settings sidebar"
        topOffset={topOffset}
      />
      
      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="settings-sidebar-panel">
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle="Workspace Settings"
          title="Settings"
          closeLabel="Close Settings"
        />

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-primary/10 px-5 pt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveTab("skills")}
            className={[
              "px-4 py-2 font-medium text-sm shrink-0 transition-colors focus-visible:outline-none border-b-2",
              activeTab === "skills"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-muted hover:text-on-surface hover:border-on-surface/30",
            ].join(" ")}
          >
            Installed Skills
          </button>
          <button
            onClick={() => setActiveTab("mcp")}
            className={[
              "px-4 py-2 font-medium text-sm shrink-0 transition-colors focus-visible:outline-none border-b-2",
              activeTab === "mcp"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-muted hover:text-on-surface hover:border-on-surface/30",
            ].join(" ")}
          >
            Configured MCPs
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={[
              "px-4 py-2 font-medium text-sm shrink-0 transition-colors focus-visible:outline-none border-b-2",
              activeTab === "integrations"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-muted hover:text-on-surface hover:border-on-surface/30",
            ].join(" ")}
          >
            API Integrations
          </button>
        </div>

        {/* Content */}
        <RightSidebarContent>
          {activeTab === "skills" ? (
            <SkillsTab />
          ) : activeTab === "mcp" ? (
            <McpTab />
          ) : (
            <IntegrationsTab />
          )}
        </RightSidebarContent>
      </RightSidebarPanel>
    </>
  );
}
