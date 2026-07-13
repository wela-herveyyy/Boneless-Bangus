"use client";

import { LuSettings, LuX } from "react-icons/lu";
import { useSettingsSidebar, type SettingsTab } from "./settingsSidebar.hooks";
import {
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { SkillsTab } from "./SkillsTab";
import { McpTab } from "./McpTab";

export function SettingsSidebar() {
  const sidebar = useSettingsSidebar();
  const { activeTab, setActiveTab, closeSidebar } = sidebar;

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<LuSettings className="size-6" aria-hidden />}
        labelOpen="Hide settings sidebar"
        labelClosed="Show settings sidebar"
        topClass="top-[calc(50%+5.5rem)]"
      />
      
      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="settings-sidebar-panel">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 bg-surface-container-low p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">
              Workspace Settings
            </p>
            <h2 className="font-display text-xl font-bold text-primary">Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeSidebar}
              className="flex size-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
              aria-label="Close Settings"
            >
              <LuX className="size-5" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-primary/10 px-5 pt-3">
          <button
            onClick={() => setActiveTab("skills")}
            className={[
              "px-4 py-2 font-medium text-sm transition-colors focus-visible:outline-none border-b-2",
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
              "px-4 py-2 font-medium text-sm transition-colors focus-visible:outline-none border-b-2",
              activeTab === "mcp"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-muted hover:text-on-surface hover:border-on-surface/30",
            ].join(" ")}
          >
            Configured MCPs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "skills" ? <SkillsTab /> : <McpTab />}
        </div>
      </RightSidebarPanel>
    </>
  );
}
