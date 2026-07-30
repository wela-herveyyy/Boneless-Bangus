"use client";

import { useEffect, useState, type ComponentType } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeSidebar } from "@/components/organisms/ThemeSidebar/ThemeSidebar";
import { SkillsMarketplaceSidebar } from "@/components/organisms/SkillsMarketplaceSidebar/SkillsMarketplaceSidebar";
import { SettingsSidebar } from "@/components/organisms/SettingsSidebar/SettingsSidebar";
import { GoogleWorkspaceSidebar } from "@/components/organisms/GoogleWorkspaceSidebar/GoogleWorkspaceSidebar";
import { GithubSidebar } from "@/components/organisms/GithubSidebar/GithubSidebar";
import {
  SchoolErpToolsSidebar,
  WorkspaceToolsSidebar,
} from "@/components/organisms/Workspace-Tools/WorkspaceTools";
import { getMyAccessAction } from "@/lib/domain/actions/profile.actions";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";
import {
  parseErpEmbedParams,
  persistEmbedParent,
  shouldHideSchoolErpSidebar,
} from "@/lib/utils/erp-embed";

/** Theme is localStorage-only — available without sign-in. */
const PUBLIC_SIDEBARS: ComponentType<{ topOffset?: string }>[] = [ThemeSidebar];

/** `/team` omitted — team profile is a focused page (no workspace tool rail). */
const AUTH_SIDEBAR_PATHS = ["/workspace", "/admin", "/user", "/team"];
const PUBLIC_THEME_PATHS = ["/landing", "/docs", "/sign-in", "/sign-up", "/dcmu"];

export function RightSidebars() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hideSchoolEmbed, setHideSchoolEmbed] = useState(false);
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    const { parent } = parseErpEmbedParams(searchParams);
    if (parent) persistEmbedParent(parent);
    setHideSchoolEmbed(shouldHideSchoolErpSidebar(parent));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getMyAccessAction();
      if (cancelled) return;
      if (result.ok) {
        setPermissions(result.permissions ?? []);
      } else {
        setPermissions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const showAuthRail = AUTH_SIDEBAR_PATHS.some((path) => pathname?.startsWith(path));
  const showPublicTheme = PUBLIC_THEME_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );

  if (!showAuthRail && !showPublicTheme) return null;

  const sidebars: ComponentType<{ topOffset?: string }>[] = showAuthRail
    ? [
        ...(hasPermission(permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS)
          ? [GoogleWorkspaceSidebar]
          : []),
        ...(hasPermission(permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)
          ? [GithubSidebar]
          : []),
        ...(hasPermission(permissions, USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS) &&
        !hideSchoolEmbed
          ? [SchoolErpToolsSidebar]
          : []),
        ...(hasPermission(permissions, USER_PERMISSION.ERPNEXT_LIVRO_ACCESS)
          ? [WorkspaceToolsSidebar]
          : []),
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
