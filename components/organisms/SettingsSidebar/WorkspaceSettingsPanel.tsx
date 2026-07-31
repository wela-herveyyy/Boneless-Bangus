"use client";

import { useState } from "react";
import { LuFocus, LuSettings, LuWorkflow } from "react-icons/lu";
import { SkillsTab } from "./SkillsTab";
import { McpTab } from "./McpTab";
import { IntegrationsTab } from "./IntegrationsTab";
import type { SettingsTab } from "./settingsSidebar.hooks";

const TABS: { id: SettingsTab; label: string; hint: string; icon: typeof LuSettings }[] = [
  { id: "mcp", label: "MCPs", hint: "Servers & tools", icon: LuWorkflow },
  { id: "skills", label: "Installed", hint: "Active skills", icon: LuFocus },
  { id: "integrations", label: "APIs", hint: "Google & more", icon: LuSettings },
];

/** Installed skills / MCPs / integrations — embeddable in profile modal. */
export function WorkspaceSettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("mcp");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
      {/* Sub-nav: chips on mobile, rail on desktop */}
      <nav
        className="flex shrink-0 gap-2 overflow-x-auto bbai-scroll sm:w-36 sm:flex-col sm:overflow-visible"
        aria-label="Workspace tools"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={active}
              className={[
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
                "sm:flex-col sm:items-center sm:gap-1 sm:px-2 sm:py-3",
                active
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high hover:text-on-surface",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-tight">{tab.label}</span>
                <span
                  className={[
                    "hidden text-[10px] leading-tight sm:block",
                    active ? "text-on-primary/80" : "text-on-surface-muted",
                  ].join(" ")}
                >
                  {tab.hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 rounded-2xl bg-surface-container-low p-3 sm:p-4">
        {activeTab === "skills" ? (
          <SkillsTab />
        ) : activeTab === "mcp" ? (
          <McpTab />
        ) : (
          <IntegrationsTab />
        )}
      </div>
    </div>
  );
}
