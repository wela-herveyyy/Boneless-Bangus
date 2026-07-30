"use client";

import { useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
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
  isLivroParent,
  persistEmbedParent,
  persistEmbedSidClient,
  persistSchoolMcpAuto,
  readEmbedParamsFromWindow,
} from "@/lib/utils/erp-embed";

/** Theme is localStorage-only — available without sign-in. */
const PUBLIC_SIDEBARS: ComponentType<{ topOffset?: string }>[] = [ThemeSidebar];

/** `/team` omitted — team profile is a focused page (no workspace tool rail). */
const AUTH_SIDEBAR_PATHS = ["/workspace", "/admin", "/user", "/team"];
const PUBLIC_THEME_PATHS = ["/landing", "/docs", "/sign-in", "/sign-up", "/dcmu"];

/** Keep school SID wired when landing on workspace with embed query params (MCP still works without the UI). */
function syncSchoolSidFromUrl() {
  if (typeof window === "undefined") return;
  const { sid, parent, schoolMcp } = readEmbedParamsFromWindow();
  if (parent) persistEmbedParent(parent);
  if (schoolMcp === "auto") persistSchoolMcpAuto(null);
  if (sid && parent && !isLivroParent(parent)) {
    persistEmbedSidClient(
      {
        sid,
        fullName: localStorage.getItem("bbai_school_erp_user") || "User",
        email: localStorage.getItem("bbai_school_erp_email") || "",
        baseUrl: parent,
      },
      { forceSchool: true },
    );
  }
}

export function RightSidebars() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    syncSchoolSidFromUrl();
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      syncSchoolSidFromUrl();
      const result = await getMyAccessAction();
      if (cancelled) return;
      if (result.ok) {
        setPermissions(result.permissions ?? []);
        setRole(result.role ?? null);
      } else {
        setPermissions([]);
        setRole(null);
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

  const isTeacher = role === "teacher";

  // Teachers (school clients): Google only.
  // Internal workforce: full rail including School ERP login for school sites.
  const sidebars: ComponentType<{ topOffset?: string }>[] = showAuthRail
    ? isTeacher
      ? [GoogleWorkspaceSidebar]
      : [
          ...(hasPermission(permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS)
            ? [GoogleWorkspaceSidebar]
            : []),
          ...(hasPermission(permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)
            ? [GithubSidebar]
            : []),
          ...(hasPermission(permissions, USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS)
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
