"use client";

import Link from "next/link";
import { LuRefreshCw, LuShield, LuUsersRound } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  ASSIGNABLE_PERMISSION_OPTIONS,
  type UserRole,
  type UserSelect,
} from "@/lib/entities/users.type";
import { AdminShell } from "@/components/molecules/AdminShell/AdminShell";
import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";
import { Modal } from "@/components/molecules/Modal/Modal";
import { useAdminPage } from "./adminPage.hooks";

type AdminPageProps = {
  initialUsers: UserSelect[];
  currentUserId: string;
  currentUserName?: string | null;
  currentUserRole?: UserRole | null;
};

function roleLabel(role: string) {
  if (!role) return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function KeyStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-muted">
      <span className={`size-1.5 rounded-full ${ok ? "bg-tertiary" : "bg-secondary"}`} />
      {label}
    </span>
  );
}

export function AdminPage({
  initialUsers,
  currentUserId,
  currentUserName = "Admin",
  currentUserRole = "admin",
}: AdminPageProps) {
  const admin = useAdminPage(initialUsers);

  const ownerCount = admin.users.filter((u) => u.role === "owner").length;
  const adminCount = admin.users.filter((u) => u.role === "admin").length;

  return (
    <AdminShell
      active={admin.tab}
      currentUserName={currentUserName?.trim() || "Admin"}
      currentUserRole={currentUserRole}
      counts={{
        users: admin.users.length,
        teams: admin.teams.length || "—",
        roles: admin.roles.length || "—",
      }}
      onNavigateTab={admin.navigateTab}
    >
      <ConfirmModal
        isOpen={!!admin.verificationAction}
        title={admin.verificationAction?.title ?? ""}
        message={admin.verificationAction?.message ?? ""}
        confirmLabel={admin.verificationAction?.confirmLabel}
        confirmVariant={admin.verificationAction?.confirmVariant}
        tone={admin.verificationAction?.tone}
        onCancel={admin.closeVerification}
        onConfirm={() => void admin.verificationAction?.onConfirm?.()}
      />

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {admin.tab === "users" ? "Access" : admin.tab === "teams" ? "Organization" : "Permissions & Onboarding"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {admin.tab === "users"
            ? "People & access"
            : admin.tab === "teams"
              ? "Teams & shared keys"
              : "Role Management"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-on-surface-muted">
          {admin.tab === "users"
            ? "Change roles and open dedicated user profiles for usage and archives."
            : admin.tab === "teams"
              ? "Create teams, then open a team profile for members and shared API keys."
              : "Create and manage system roles used during onboarding and user assignment."}
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Users</p>
          <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
            {admin.users.length}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Owners / Admins</p>
          <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
            {ownerCount + adminCount}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Teams</p>
          <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
            {admin.loadingTeams && admin.teams.length === 0 ? "…" : admin.teams.length}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Roles</p>
          <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
            {admin.loadingRoles && admin.roles.length === 0 ? "…" : admin.roles.length}
          </p>
        </div>
      </div>

      {admin.error ? (
        <p className="mb-4 rounded-2xl bg-secondary-container px-4 py-3 text-sm text-secondary">
          {admin.error}
        </p>
      ) : null}
      {admin.notice ? (
        <p className="mb-4 rounded-2xl bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
          {admin.notice}
        </p>
      ) : null}

      {admin.tab === "users" ? (
        <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-bloom sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Input
              value={admin.query}
              onChange={(e) => admin.setQuery(e.target.value)}
              placeholder="Search by name, email, or role…"
              className="min-w-0 flex-1"
            />
            <Button type="button" variant="secondary" onClick={() => void admin.refreshUsers()}>
              <LuRefreshCw className="size-4" />
            </Button>
          </div>
          <p className="mb-4 text-xs text-on-surface-muted">
            Open a user to view their dedicated profile, usage, and prompt archives.
          </p>

          <ul className="space-y-2">
            {admin.filteredUsers.map((user) => (
              <li
                key={user.id}
                className="rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/user/${user.id}`} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-on-surface">{user.name}</p>
                      {user.id === currentUserId ? (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          You
                        </span>
                      ) : null}
                      {(user.role === "owner" || user.role === "admin") && (
                        <span className="rounded-md bg-tertiary/10 px-1.5 py-0.5 text-[10px] font-semibold text-tertiary">
                          {roleLabel(user.role)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-on-surface-muted">{user.email}</p>
                    <p className="mt-2 text-xs font-medium text-primary">Open profile →</p>
                  </Link>
                  <select
                    value={user.role}
                    disabled={admin.savingRoleId === user.id}
                    onChange={(e) => void admin.changeRole(user.id, e.target.value as UserRole)}
                    className="rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {admin.roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
            {admin.filteredUsers.length === 0 ? (
              <li className="rounded-2xl bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-muted">
                No users match your search.
              </li>
            ) : null}
          </ul>
        </section>
      ) : admin.tab === "teams" ? (
        <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-bloom sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">All teams</h2>
              <p className="text-xs text-on-surface-muted">
                Open a team for members, join code, and API keys
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => void admin.refreshTeams()}>
                <LuRefreshCw className="size-4" />
              </Button>
              <Button type="button" onClick={() => admin.setCreateTeamOpen(true)}>
                Create team
              </Button>
            </div>
          </div>
          {admin.loadingTeams ? (
            <p className="text-sm text-on-surface-muted">Loading teams…</p>
          ) : admin.teams.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-surface-container-low px-4 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-muted">
                <LuUsersRound className="size-5" />
              </span>
              <p className="text-sm font-medium text-on-surface">No teams yet</p>
              <p className="mt-1 text-xs text-on-surface-muted">
                Create one to share a join code with members.
              </p>
              <Button type="button" className="mt-4" onClick={() => admin.setCreateTeamOpen(true)}>
                Create team
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {admin.teams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/team/${team.id}`}
                    className="block rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high/60 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{team.name}</p>
                        <p className="mt-1 text-xs text-on-surface-muted">
                          Leader {team.managerName} · {team.memberCount} members
                        </p>
                        {team.description ? (
                          <p className="mt-1 text-xs text-on-surface-muted">{team.description}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-3">
                          <KeyStatus ok={team.hasCursorApiKey} label="Cursor" />
                          <KeyStatus ok={team.hasGeminiApiKey} label="Gemini" />
                        </div>
                        <p className="mt-3 text-xs font-medium text-primary">Open team profile →</p>
                      </div>
                      <span className="rounded-xl bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-primary">
                        {team.code}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="rounded-3xl bg-surface-container-lowest p-5 shadow-bloom sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">Roles</h2>
              <p className="text-xs text-on-surface-muted">
                Dynamic records managed by Admin and Owner accounts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => void admin.refreshRoles()}>
                <LuRefreshCw className="size-4" />
              </Button>
              <Button type="button" onClick={() => admin.setCreateRoleOpen(true)}>
                Create role
              </Button>
            </div>
          </div>
          {admin.loadingRoles ? (
            <p className="text-sm text-on-surface-muted">Loading roles…</p>
          ) : admin.roles.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-surface-container-low px-4 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-muted">
                <LuShield className="size-5" />
              </span>
              <p className="text-sm font-medium text-on-surface">No roles yet</p>
              <p className="mt-1 text-xs text-on-surface-muted">
                Create your first system role record.
              </p>
              <Button type="button" className="mt-4" onClick={() => admin.setCreateRoleOpen(true)}>
                Create role
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {admin.roles.map((role) => {
                const isProtected = role.value === "owner" || role.value === "admin";
                return (
                  <li key={role.id} className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-on-surface">{role.label}</p>
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                            {role.value}
                          </span>
                          {isProtected ? (
                            <span className="rounded-md bg-tertiary/10 px-2 py-0.5 text-[10px] font-semibold text-tertiary">
                              System Protected
                            </span>
                          ) : null}
                        </div>
                        {role.hint ? (
                          <p className="mt-1.5 text-xs font-medium text-on-surface-muted">
                            Onboarding Hint: {role.hint}
                          </p>
                        ) : null}
                        {role.description ? (
                          <p className="mt-1 text-xs text-on-surface-muted">{role.description}</p>
                        ) : null}
                        {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {role.permissions.map((perm) => (
                              <span
                                key={perm}
                                className="rounded-md bg-surface-container-high px-2 py-0.5 font-mono text-[10px] text-on-surface-muted"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-secondary">No permissions assigned</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs"
                          onClick={() => admin.startEditRole(role)}
                        >
                          Edit
                        </Button>
                        {!isProtected ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-xs text-secondary hover:bg-secondary-container/50"
                            disabled={admin.deletingRoleId === role.id}
                            onClick={() => void admin.removeRole(role.id, role.label)}
                          >
                            {admin.deletingRoleId === role.id ? "…" : "Delete"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <Modal
        isOpen={admin.createTeamOpen}
        onClose={admin.closeCreateTeam}
        title="Create team"
        description="The manager becomes team leader and cannot leave the team."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={admin.closeCreateTeam}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={admin.creatingTeam || !admin.teamName.trim()}
              onClick={() => void admin.createTeam()}
            >
              {admin.creatingTeam ? "Creating…" : "Create team"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={admin.teamName}
            onChange={(e) => admin.setTeamName(e.target.value)}
            placeholder="Team name"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.teamDescription}
            onChange={(e) => admin.setTeamDescription(e.target.value)}
            placeholder="Description (optional)"
            className="bg-surface-container-low"
          />
          <select
            value={admin.teamManagerId}
            onChange={(e) => admin.setTeamManagerId(e.target.value)}
            className="w-full rounded-xl bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
          >
            <option value="">Team leader: you (default)</option>
            {admin.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={admin.createRoleOpen}
        onClose={admin.closeCreateRole}
        title="Create role"
        description="Define a new dynamic role for users and onboarding selection."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={admin.closeCreateRole}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={admin.creatingRole || !admin.roleValue.trim() || !admin.roleLabel.trim()}
              onClick={() => void admin.createRole()}
            >
              {admin.creatingRole ? "Creating…" : "Create role"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={admin.roleValue}
            onChange={(e) => admin.setRoleValue(e.target.value)}
            placeholder="Role identifier (e.g. tech, sales, data-eng)"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.roleLabel}
            onChange={(e) => admin.setRoleLabel(e.target.value)}
            placeholder="Display label (e.g. Tech Infrastructure)"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.roleHint}
            onChange={(e) => admin.setRoleHint(e.target.value)}
            placeholder="Short hint for onboarding (optional)"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.roleDescription}
            onChange={(e) => admin.setRoleDescription(e.target.value)}
            placeholder="Description & responsibilities (optional)"
            className="bg-surface-container-low"
          />
          <RolePermissionToggles
            selected={admin.rolePermissions}
            onToggle={admin.toggleRolePermission}
          />
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(admin.editingRoleId)}
        onClose={admin.cancelEditRole}
        title="Edit role"
        description="Modify role details and access rights (tools, admin, chat)."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={admin.cancelEditRole}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                admin.updatingRole || !admin.editRoleValue.trim() || !admin.editRoleLabel.trim()
              }
              onClick={() => void admin.saveRole()}
            >
              {admin.updatingRole ? "Saving…" : "Update role"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            value={admin.editRoleValue}
            onChange={(e) => admin.setEditRoleValue(e.target.value)}
            disabled={admin.editRoleValue === "owner" || admin.editRoleValue === "admin"}
            placeholder="Role identifier (e.g. tech, sales, data-eng)"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.editRoleLabel}
            onChange={(e) => admin.setEditRoleLabel(e.target.value)}
            placeholder="Display label (e.g. Tech Infrastructure)"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.editRoleHint}
            onChange={(e) => admin.setEditRoleHint(e.target.value)}
            placeholder="Short hint for onboarding (optional)"
            className="bg-surface-container-low"
          />
          <Input
            value={admin.editRoleDescription}
            onChange={(e) => admin.setEditRoleDescription(e.target.value)}
            placeholder="Description & responsibilities (optional)"
            className="bg-surface-container-low"
          />
          <RolePermissionToggles
            selected={admin.editRolePermissions}
            onToggle={admin.toggleEditRolePermission}
          />
        </div>
      </Modal>
    </AdminShell>
  );
}

function RolePermissionToggles({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
}) {
  const groups = ["tools", "admin", "chat"] as const;
  return (
    <div className="space-y-3 rounded-2xl bg-surface-container-low p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
        Access rights
      </p>
      {groups.map((group) => {
        const options = ASSIGNABLE_PERMISSION_OPTIONS.filter((o) => o.group === group);
        return (
          <div key={group} className="space-y-1.5">
            <p className="text-[11px] font-medium capitalize text-on-surface-muted">{group}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggle(opt.value, e.target.checked)}
                      className="size-3.5 accent-(--color-primary)"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
