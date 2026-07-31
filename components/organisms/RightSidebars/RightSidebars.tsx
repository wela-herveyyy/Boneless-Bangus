"use client";

import { useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { ThemeSidebar } from "@/components/organisms/ThemeSidebar/ThemeSidebar";
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
import { buildRightDockTools, RightToolsDock } from "./RightToolsDock";

/** Theme only on public pages — workspace theme/skills/settings live in Profile. */
const PUBLIC_SIDEBARS: ComponentType<{ topOffset?: string }>[] = [ThemeSidebar];

const AUTH_SIDEBAR_PATHS = ["/workspace", "/admin", "/user", "/team"];
const PUBLIC_THEME_PATHS = ["/landing", "/docs", "/sign-in", "/sign-up", "/dcmu"];

function syncSchoolSidFromUrl() {
  if (typeof window === "undefined") return;
  const { sid, parent, schoolMcp } = readEmbedParamsFromWindow();
  if (!sid?.trim() || !parent || isLivroParent(parent)) return;
  persistEmbedParent(parent);
  if (schoolMcp === "auto") persistSchoolMcpAuto(null);
  persistEmbedSidClient(
    {
      sid: sid.trim(),
      fullName: localStorage.getItem("bbai_school_erp_user") || "User",
      email: localStorage.getItem("bbai_school_erp_email") || "",
      baseUrl: parent,
    },
    { forceSchool: true },
  );
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
  const permsReady = permissions !== null;

  const showGoogle =
    showAuthRail &&
    permsReady &&
    (isTeacher || hasPermission(permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS));
  const showGithub =
    showAuthRail &&
    permsReady &&
    !isTeacher &&
    hasPermission(permissions, USER_PERMISSION.GITHUB_MCP_ACCESS);
  const showSchool =
    showAuthRail &&
    permsReady &&
    !isTeacher &&
    hasPermission(permissions, USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS);
  const showLivro =
    showAuthRail &&
    permsReady &&
    !isTeacher &&
    hasPermission(permissions, USER_PERMISSION.ERPNEXT_LIVRO_ACCESS);

  const sidebars: ComponentType<{ topOffset?: string }>[] = showAuthRail
    ? isTeacher
      ? [GoogleWorkspaceSidebar]
      : [
        ...(showGoogle ? [GoogleWorkspaceSidebar] : []),
        ...(showGithub ? [GithubSidebar] : []),
        ...(showSchool ? [SchoolErpToolsSidebar] : []),
        ...(showLivro ? [WorkspaceToolsSidebar] : []),
      ]
    : PUBLIC_SIDEBARS;

  const dockTools = buildRightDockTools({
    showGoogle,
    showGithub,
    showSchool,
    showLivro,
  });

  if (!showAuthRail) {
    return (
      <div className="pointer-events-none fixed inset-0 z-300">
        {sidebars.map((Sidebar, i) => (
          <Sidebar key={i} />
        ))}
      </div>
    );
  }

  return (
    <RightToolsDock tools={dockTools}>
      {sidebars.map((Sidebar, i) => (
        <Sidebar key={i} />
      ))}
    </RightToolsDock>
  );
}
