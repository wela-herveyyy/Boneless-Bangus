"use client";

import Link from "next/link";
import {
  LuFishSymbol,
  LuMessageSquare,
  LuShield,
  LuUsers,
  LuUsersRound,
} from "react-icons/lu";
import { FuturisticBackdrop } from "@/components/molecules/FuturisticBackdrop/FuturisticBackdrop";
import type { UserRole } from "@/lib/entities/users.type";

export type AdminNavKey = "users" | "teams" | "roles" | "user" | "team";

type AdminShellProps = {
  active: AdminNavKey;
  currentUserName: string;
  currentUserRole?: UserRole | string | null;
  counts?: {
    users?: number;
    teams?: number | string;
    roles?: number | string;
  };
  children: React.ReactNode;
  /** When set, Users/Teams/Roles use callbacks instead of navigation (admin home). */
  onNavigateTab?: (tab: "users" | "teams" | "roles") => void;
  /**
   * `full` — admin Users/Teams/Roles nav.
   * `teamLeader` — only team profile + back to chat (no admin links).
   */
  navMode?: "full" | "teamLeader";
};

function roleLabel(role: string) {
  if (!role) return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function initialsFromName(name: string | null | undefined) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "A";
}

function navClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors",
    active
      ? "bg-surface-container-lowest text-on-surface shadow-bloom"
      : "text-on-surface-muted hover:bg-surface-container-high/70 hover:text-on-surface",
  ].join(" ");
}

export function AdminShell({
  active,
  currentUserName,
  currentUserRole = "admin",
  counts,
  children,
  onNavigateTab,
  navMode = "full",
}: AdminShellProps) {
  const displayName = currentUserName?.trim() || "Admin";
  const displayRole = String(currentUserRole ?? "admin");
  const isTeamLeaderNav = navMode === "teamLeader";

  const usersActive = active === "users" || active === "user";
  const teamsActive = active === "teams" || active === "team";
  const rolesActive = active === "roles";

  function TabLink({
    tab,
    href,
    isActive,
    icon,
    label,
    count,
  }: {
    tab: "users" | "teams" | "roles";
    href: string;
    isActive: boolean;
    icon: React.ReactNode;
    label: string;
    count?: number | string;
  }) {
    const className = navClass(isActive);
    if (onNavigateTab) {
      return (
        <button type="button" onClick={() => onNavigateTab(tab)} className={className}>
          {icon}
          {label}
          {count !== undefined ? (
            <span className="ml-auto rounded-lg bg-surface-container-high px-2 py-0.5 text-[11px] tabular-nums text-on-surface-muted">
              {count}
            </span>
          ) : null}
        </button>
      );
    }
    return (
      <Link href={href} className={className}>
        {icon}
        {label}
        {count !== undefined ? (
          <span className="ml-auto rounded-lg bg-surface-container-high px-2 py-0.5 text-[11px] tabular-nums text-on-surface-muted">
            {count}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-surface">
      <FuturisticBackdrop />
      <aside className="sticky top-0 z-10 hidden h-screen w-64 shrink-0 flex-col bg-surface-container-low md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-container text-on-primary shadow-bloom">
            <LuFishSymbol className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-on-surface">Giya Control</p>
            <p className="text-xs text-on-surface-muted">
              {isTeamLeaderNav ? "Team leader" : "Administration"}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {isTeamLeaderNav ? (
            <>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                Your team
              </p>
              <div className={navClass(true)}>
                <LuUsersRound className="size-4 shrink-0" aria-hidden />
                Team profile
              </div>
            </>
          ) : (
            <>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                Manage
              </p>
              <TabLink
                tab="users"
                href="/admin?tab=users"
                isActive={usersActive}
                icon={<LuUsers className="size-4 shrink-0" aria-hidden />}
                label="Users"
                count={counts?.users}
              />
              <TabLink
                tab="teams"
                href="/admin?tab=teams"
                isActive={teamsActive}
                icon={<LuUsersRound className="size-4 shrink-0" aria-hidden />}
                label="Teams"
                count={counts?.teams ?? "—"}
              />
              <TabLink
                tab="roles"
                href="/admin?tab=roles"
                isActive={rolesActive}
                icon={<LuShield className="size-4 shrink-0" aria-hidden />}
                label="Roles"
                count={counts?.roles ?? "—"}
              />
            </>
          )}

          <div className="mt-6 px-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
              Workspace
            </p>
            <Link
              href="/workspace"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-on-surface-muted transition-colors hover:bg-surface-container-high/70 hover:text-on-surface"
            >
              <LuMessageSquare className="size-4 shrink-0" aria-hidden />
              Back to chat
            </Link>
          </div>
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                {initialsFromName(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">{displayName}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary">
                  <LuShield className="size-3" aria-hidden />
                  {roleLabel(displayRole)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative z-10 min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center gap-2 md:hidden">
          {isTeamLeaderNav ? (
            <>
              <span className="rounded-xl bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface shadow-bloom">
                Team profile
              </span>
              <Link
                href="/workspace"
                className="ml-auto rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-muted"
              >
                Chat
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/admin?tab=users"
                className={[
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  usersActive
                    ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                    : "bg-surface-container-low text-on-surface-muted",
                ].join(" ")}
              >
                Users
              </Link>
              <Link
                href="/admin?tab=teams"
                className={[
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  teamsActive
                    ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                    : "bg-surface-container-low text-on-surface-muted",
                ].join(" ")}
              >
                Teams
              </Link>
              <Link
                href="/admin?tab=roles"
                className={[
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  rolesActive
                    ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                    : "bg-surface-container-low text-on-surface-muted",
                ].join(" ")}
              >
                Roles
              </Link>
              <Link
                href="/workspace"
                className="ml-auto rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-muted"
              >
                Chat
              </Link>
            </>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
