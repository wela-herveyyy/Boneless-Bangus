"use client";

import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { McpMarketplace } from "@/components/organisms/McpMarketplace/McpMarketplace";
import { ThemeSidebar } from "@/components/organisms/ThemeSidebar/ThemeSidebar";
import { SkillsMarketplaceSidebar } from "@/components/organisms/SkillsMarketplaceSidebar/SkillsMarketplaceSidebar";
import { SettingsSidebar } from "@/components/organisms/SettingsSidebar/SettingsSidebar";
import { GoogleWorkspaceSidebar } from "@/components/organisms/GoogleWorkspaceSidebar/GoogleWorkspaceSidebar";
import { GithubSidebar } from "@/components/organisms/GithubSidebar/GithubSidebar";
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
  GithubSidebar,
  WorkspaceToolsSidebar,
  McpMarketplace,
  ThemeSidebar,
  SkillsMarketplaceSidebar,
  SettingsSidebar,
];

const RIGHT_SIDEBAR_PATHS = ["/workspace", "/admin", "/user", "/team"];

export function RightSidebars() {
  const pathname = usePathname();
  if (!RIGHT_SIDEBAR_PATHS.some((path) => pathname?.startsWith(path))) return null;

  return (
    <div className="fixed top-0 right-0 h-full flex flex-col justify-center gap-3.5 pointer-events-none z-120">
      {SIDEBARS.map((Sidebar, i) => (
        <Sidebar key={i} />
      ))}
    </div>
  );
}
