"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentType } from "react";
// import { McpMarketplace } from "@/components/organisms/McpMarketplace/McpMarketplace";
import { ThemeSidebar } from "@/components/organisms/ThemeSidebar/ThemeSidebar";
import { SkillsMarketplaceSidebar } from "@/components/organisms/SkillsMarketplaceSidebar/SkillsMarketplaceSidebar";
import { SettingsSidebar } from "@/components/organisms/SettingsSidebar/SettingsSidebar";
import { GoogleWorkspaceSidebar } from "@/components/organisms/GoogleWorkspaceSidebar/GoogleWorkspaceSidebar";
import { GithubSidebar } from "@/components/organisms/GithubSidebar/GithubSidebar";
import {
  SchoolErpToolsSidebar,
  WorkspaceToolsSidebar,
} from "@/components/organisms/Workspace-Tools/WorkspaceTools";
import {
  parseErpEmbedParams,
  persistEmbedParent,
  shouldHideSchoolErpSidebar,
} from "@/lib/utils/erp-embed";

/**
 * All right-sidebar panels, rendered once at the layout root.
 *
 * To add a sidebar:
 *  1. Build it with the shared primitives and accept `{ topOffset?: string }`.
 *  2. Add it to AUTH_SIDEBARS (or PUBLIC_SIDEBARS if it should work signed-out).
 */

/** Theme is localStorage-only — available without sign-in. */
const PUBLIC_SIDEBARS: ComponentType<{ topOffset?: string }>[] = [ThemeSidebar];

/** `/team` omitted — team profile is a focused page (no workspace tool rail). */
const AUTH_SIDEBAR_PATHS = ["/workspace", "/admin", "/user", "/team"];
const PUBLIC_THEME_PATHS = ["/landing", "/docs", "/sign-in", "/sign-up"]; // sign-up redirects to sign-in

export function RightSidebars() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hideSchool, setHideSchool] = useState(false);

  useEffect(() => {
    const { parent } = parseErpEmbedParams(searchParams);
    if (parent) persistEmbedParent(parent);
    setHideSchool(shouldHideSchoolErpSidebar(parent));
  }, [searchParams]);

  const showAuthRail = AUTH_SIDEBAR_PATHS.some((path) => pathname?.startsWith(path));
  const showPublicTheme = PUBLIC_THEME_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );

  if (!showAuthRail && !showPublicTheme) return null;

  const sidebars = showAuthRail
    ? [
        GoogleWorkspaceSidebar,
        GithubSidebar,
        ...(hideSchool ? [] : [SchoolErpToolsSidebar]),
        // McpMarketplace, // hidden in UI for now
        WorkspaceToolsSidebar,
        ThemeSidebar,
        SkillsMarketplaceSidebar,
        SettingsSidebar,
      ]
    : PUBLIC_SIDEBARS;

  return (
    <div className="fixed top-0 right-0 z-120 flex h-full flex-col justify-center gap-3.5 pointer-events-none">
      {sidebars.map((Sidebar, i) => (
        <Sidebar key={i} />
      ))}
    </div>
  );
}
