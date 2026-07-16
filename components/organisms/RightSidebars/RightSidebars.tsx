"use client";

import type { ComponentType } from "react";
import { McpMarketplace } from "@/components/organisms/McpMarketplace/McpMarketplace";
import { ThemeSidebar } from "@/components/organisms/ThemeSidebar/ThemeSidebar";
import { SkillsMarketplaceSidebar } from "@/components/organisms/SkillsMarketplaceSidebar/SkillsMarketplaceSidebar";
import { SettingsSidebar } from "@/components/organisms/SettingsSidebar/SettingsSidebar";
import { GoogleWorkspaceSidebar } from "@/components/organisms/GoogleWorkspaceSidebar/GoogleWorkspaceSidebar";
import { WorkspaceToolsSidebar } from "@/components/organisms/Workspace-Tools/WorkspaceTools";

const TRIGGER_SPACING_REM = 3.5;

/**
 * All right-sidebar panels, rendered once at the layout root.
 * Trigger positions auto-adjust when you add/remove/reorder entries.
 *
 * To add a sidebar:
 *  1. Build it with the shared primitives and accept `{ topOffset?: string }`.
 *  2. Add it to the array below (order = top → bottom).
 */
const SIDEBARS: ComponentType<{ topOffset?: string }>[] = [
  GoogleWorkspaceSidebar,
  WorkspaceToolsSidebar,
  McpMarketplace,
  ThemeSidebar,
  SkillsMarketplaceSidebar,
  SettingsSidebar,
];

function triggerTop(index: number, total: number): string {
  const offset = (index - (total - 1) / 2) * TRIGGER_SPACING_REM;
  if (offset === 0) return "50%";
  return `calc(50% ${offset > 0 ? "+" : "-"} ${Math.abs(offset)}rem)`;
}

export function RightSidebars() {
  return (
    <>
      {SIDEBARS.map((Sidebar, i) => (
        <Sidebar key={i} topOffset={triggerTop(i, SIDEBARS.length)} />
      ))}
    </>
  );
}
