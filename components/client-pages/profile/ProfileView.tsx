"use client";

import { useActionState, useState, startTransition, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LuKeyRound,
  LuPalette,
  LuPuzzle,
  LuUser,
  LuWrench,
  LuX,
} from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";
import { ThemePanel } from "@/components/organisms/ThemeSidebar/ThemePanel";
import { SkillsMarketplacePanel } from "@/components/organisms/SkillsMarketplaceSidebar/SkillsMarketplacePanel";
import { WorkspaceSettingsPanel } from "@/components/organisms/SettingsSidebar/WorkspaceSettingsPanel";
import {
  updateApiKeysAction,
  joinTeamAction,
  leaveTeamAction,
  updatePersonalInfoAction,
} from "@/lib/domain/actions/profile.actions";
import { updateTeamApiKeysAction } from "@/lib/domain/actions/team.actions";

type ProfileViewProps = {
  userId?: string;
  userName: string;
  userEmail: string;
  userSettings: {
    cursorApiKey: string | null;
    geminiApiKey: string | null;
  } | null;
  userTeam: {
    teamId: string;
    teamCode: string;
    teamName: string;
    cursorApiKey: string | null;
    geminiApiKey: string | null;
    isManager: boolean;
  } | null;
  onClose?: () => void;
  /** Open a specific section when the modal mounts. */
  initialSection?: ProfileSection;
};

type ConfirmState = {
  type: "save_keys" | "save_team_keys" | "join_team" | "leave_team" | "save_personal_info";
  formData: FormData;
} | null;

export type ProfileSection = "account" | "theme" | "skills" | "tools";

const SECTIONS: {
  id: ProfileSection;
  label: string;
  hint: string;
  icon: typeof LuUser;
}[] = [
  { id: "account", label: "Account", hint: "Profile & keys", icon: LuUser },
  { id: "theme", label: "Theme", hint: "Colors & tokens", icon: LuPalette },
  { id: "skills", label: "Skills", hint: "Marketplace", icon: LuPuzzle },
  { id: "tools", label: "Tools", hint: "MCP & APIs", icon: LuWrench },
];

export function ProfileView({
  userId,
  userName,
  userEmail,
  userSettings,
  userTeam,
  onClose,
  initialSection = "account",
}: ProfileViewProps) {
  const router = useRouter();
  const [section, setSection] = useState<ProfileSection>(initialSection);
  const [personalInfoState, personalInfoAction] = useActionState(updatePersonalInfoAction, null);
  const [apiKeyState, apiKeysFormAction] = useActionState(updateApiKeysAction, null);
  const [teamKeyState, teamKeysFormAction] = useActionState(updateTeamApiKeysAction, null);
  const [joinState, joinFormAction] = useActionState(joinTeamAction, null);
  const [leaveState, leaveFormAction] = useActionState(leaveTeamAction, null);

  const [confirmAction, setConfirmAction] = useState<ConfirmState>(null);
  const [editingKey, setEditingKey] = useState<
    "gemini" | "cursor" | "team_gemini" | "team_cursor" | "personal_info" | null
  >(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (apiKeyState?.ok) setFeedback({ type: "success", message: "API keys updated successfully." });
    else if (apiKeyState?.error) setFeedback({ type: "error", message: apiKeyState.error });
  }, [apiKeyState]);

  useEffect(() => {
    if (teamKeyState?.ok) {
      setFeedback({ type: "success", message: "Team API keys updated successfully." });
      setEditingKey(null);
      router.refresh();
    } else if (teamKeyState?.error) {
      setFeedback({ type: "error", message: teamKeyState.error });
    }
  }, [teamKeyState, router]);

  useEffect(() => {
    if (joinState?.ok) setFeedback({ type: "success", message: "Successfully joined the team." });
    else if (joinState?.error) setFeedback({ type: "error", message: joinState.error });
  }, [joinState]);

  useEffect(() => {
    if (leaveState?.ok) setFeedback({ type: "success", message: "Successfully left the team." });
    else if (leaveState?.error) setFeedback({ type: "error", message: leaveState.error });
  }, [leaveState]);

  useEffect(() => {
    if (personalInfoState?.ok) {
      setFeedback({ type: "success", message: "Personal information updated successfully!" });
      setEditingKey(null);
    } else if (personalInfoState?.error) {
      setFeedback({ type: "error", message: personalInfoState.error });
    }
  }, [personalInfoState]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, formData } = confirmAction;
    setConfirmAction(null);

    startTransition(() => {
      if (type === "save_keys") apiKeysFormAction(formData);
      if (type === "save_team_keys") teamKeysFormAction(formData);
      if (type === "join_team") joinFormAction(formData);
      if (type === "leave_team") leaveFormAction(formData);
      if (type === "save_personal_info") personalInfoAction(formData);
    });
  };

  const activeMeta = SECTIONS.find((s) => s.id === section)!;

  return (
    <>
      <div className="fixed inset-0 z-130 flex items-end justify-center bg-on-surface/40 sm:items-center sm:px-4">
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          aria-label="Dismiss profile"
          onClick={handleClose}
        />
        <div
          className="relative flex h-[min(92vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] bg-surface-container-lowest shadow-bloom sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-title"
        >
          <header className="shrink-0 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  id="profile-settings-title"
                  className="font-display text-xl font-bold text-on-surface sm:text-2xl"
                >
                  Profile
                </h1>
                <p className="mt-0.5 text-sm text-on-surface-muted">
                  {activeMeta.hint} · {userName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
                aria-label="Close modal"
              >
                <LuX className="size-5" />
              </button>
            </div>

            <nav
              className="mt-4 flex gap-1 overflow-x-auto bbai-scroll sm:grid sm:grid-cols-4 sm:gap-2"
              aria-label="Profile sections"
            >
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-pressed={active}
                    className={[
                      "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                      "sm:flex-col sm:items-center sm:gap-1 sm:px-2 sm:py-3",
                      active
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high hover:text-on-surface",
                    ].join(" ")}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </header>

          {feedback ? (
            <div
              className={[
                "mx-4 shrink-0 rounded-xl px-4 py-3 text-sm font-medium sm:mx-5",
                feedback.type === "success"
                  ? "bg-tertiary/10 text-tertiary"
                  : "bg-secondary/10 text-secondary",
              ].join(" ")}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bbai-scroll sm:px-5 sm:pb-6">
            {section === "account" ? (
              <AccountSection
                userId={userId}
                userName={userName}
                userEmail={userEmail}
                userSettings={userSettings}
                userTeam={userTeam}
                editingKey={editingKey}
                setEditingKey={setEditingKey}
                setConfirmAction={setConfirmAction}
              />
            ) : null}
            {section === "theme" ? <ThemePanel /> : null}
            {section === "skills" ? <SkillsMarketplacePanel /> : null}
            {section === "tools" ? <WorkspaceSettingsPanel /> : null}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.type === "save_keys"
            ? "Save API keys?"
            : confirmAction?.type === "save_team_keys"
              ? "Save team API keys?"
              : confirmAction?.type === "save_personal_info"
                ? "Save personal info?"
                : confirmAction?.type === "join_team"
                  ? "Join team?"
                  : confirmAction?.type === "leave_team"
                    ? "Leave team?"
                    : "Confirm"
        }
        message={
          confirmAction?.type === "save_keys"
            ? "Update your personal API keys?"
            : confirmAction?.type === "save_team_keys"
              ? "These keys are shared with team members who do not have a personal key."
              : confirmAction?.type === "save_personal_info"
                ? "Update your personal information?"
                : confirmAction?.type === "join_team"
                  ? "Join this team with the code you entered?"
                  : confirmAction?.type === "leave_team"
                    ? "Leave your current team? You can rejoin later with a join code."
                    : ""
        }
        confirmVariant={confirmAction?.type === "leave_team" ? "danger" : "primary"}
        tone={confirmAction?.type === "leave_team" ? "danger" : "default"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-on-surface">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-on-surface-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AccountSection({
  userId,
  userName,
  userEmail,
  userSettings,
  userTeam,
  editingKey,
  setEditingKey,
  setConfirmAction,
}: {
  userId?: string;
  userName: string;
  userEmail: string;
  userSettings: ProfileViewProps["userSettings"];
  userTeam: ProfileViewProps["userTeam"];
  editingKey: "gemini" | "cursor" | "team_gemini" | "team_cursor" | "personal_info" | null;
  setEditingKey: (
    v: "gemini" | "cursor" | "team_gemini" | "team_cursor" | "personal_info" | null,
  ) => void;
  setConfirmAction: (v: ConfirmState) => void;
}) {
  return (
    <div className="grid gap-4">
      {userId ? (
        <Link
          href={`/user/${userId}`}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          View full profile, usage & prompt archives
        </Link>
      ) : null}

      <SectionCard
        title="Personal information"
        description="Name and email for this account."
        action={
          editingKey !== "personal_info" ? (
            <Button
              variant="secondary"
              className="h-auto px-3 py-1.5 text-xs"
              onClick={() => setEditingKey("personal_info")}
            >
              Edit
            </Button>
          ) : null
        }
      >
        {editingKey === "personal_info" ? (
          <form
            action={(formData) => {
              setConfirmAction({ type: "save_personal_info", formData });
            }}
            className="flex flex-col gap-4"
          >
            <div className="space-y-1">
              <Label>Name</Label>
              <Input id="name" name="name" type="text" defaultValue={userName} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input id="email" name="email" type="email" defaultValue={userEmail} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingKey(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5">
              <p className="text-xs text-on-surface-muted">Name</p>
              <p className="text-sm font-medium text-on-surface">{userName}</p>
            </div>
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5">
              <p className="text-xs text-on-surface-muted">Email</p>
              <p className="truncate text-sm font-medium text-on-surface">{userEmail}</p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Team" description="Shared workspace membership.">
        {userTeam ? (
          <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-primary">
                Current team{userTeam.isManager ? " · Leader" : ""}
              </p>
              <p className="text-lg font-semibold text-on-surface">{userTeam.teamName}</p>
              <p className="font-mono text-sm text-on-surface-muted">Code: {userTeam.teamCode}</p>
            </div>
            {userTeam.isManager ? (
              <Link
                href={`/team/${userTeam.teamId}`}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-transform active:scale-[0.98]"
              >
                Manage team
              </Link>
            ) : (
              <form action={(formData) => setConfirmAction({ type: "leave_team", formData })}>
                <Button type="submit" variant="danger">
                  Leave team
                </Button>
              </form>
            )}
          </div>
        ) : (
          <form
            action={(formData) => setConfirmAction({ type: "join_team", formData })}
            className="space-y-3"
          >
            <p className="text-sm text-on-surface-muted">You are not on a team yet.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="teamCode"
                name="teamCode"
                placeholder="6-digit team code"
                maxLength={6}
                required
                className="flex-1"
              />
              <Button type="submit">Join team</Button>
            </div>
          </form>
        )}
      </SectionCard>

      <SectionCard
        title="API keys"
        description={
          userTeam
            ? "Personal keys override the team key."
            : "Used for language models in the workspace."
        }
        action={<LuKeyRound className="size-4 text-on-surface-muted" aria-hidden />}
      >
        <div className="space-y-3">
          {(
            [
              {
                label: "Gemini",
                personalKey: userSettings?.geminiApiKey ?? null,
                teamKey: userTeam?.geminiApiKey ?? null,
                personalEdit: "gemini" as const,
                teamEdit: "team_gemini" as const,
                personalName: "geminiApiKey",
                teamName: "geminiApiKey",
                placeholder: "AIzaSy...",
              },
              {
                label: "Cursor",
                personalKey: userSettings?.cursorApiKey ?? null,
                teamKey: userTeam?.cursorApiKey ?? null,
                personalEdit: "cursor" as const,
                teamEdit: "team_cursor" as const,
                personalName: "cursorApiKey",
                teamName: "cursorApiKey",
                placeholder: "Enter Cursor API key",
              },
            ] as const
          ).map((provider) => {
            const active = provider.personalKey
              ? "personal"
              : provider.teamKey
                ? "team"
                : "none";

            return (
              <div
                key={provider.label}
                className="rounded-xl bg-surface-container-lowest p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label className="mb-0 font-semibold text-on-surface">{provider.label}</Label>
                  <p className="flex items-center gap-2 text-xs text-on-surface-muted">
                    <span
                      className={`inline-block size-2 rounded-full ${
                        active === "none" ? "bg-secondary" : "bg-tertiary"
                      }`}
                    />
                    {active === "personal"
                      ? "Using personal"
                      : active === "team"
                        ? "Using team"
                        : "Not configured"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-on-surface-muted">Personal</p>
                      {editingKey !== provider.personalEdit ? (
                        <Button
                          variant="secondary"
                          className="h-auto px-3 py-1.5 text-xs"
                          onClick={() => setEditingKey(provider.personalEdit)}
                        >
                          {provider.personalKey ? "Edit" : "Add"}
                        </Button>
                      ) : null}
                    </div>
                    {editingKey === provider.personalEdit ? (
                      <form
                        action={(formData) => {
                          setEditingKey(null);
                          setConfirmAction({ type: "save_keys", formData });
                        }}
                        className="flex flex-col gap-3 sm:flex-row"
                      >
                        <Input
                          name={provider.personalName}
                          type="password"
                          defaultValue={provider.personalKey ?? ""}
                          placeholder={provider.placeholder}
                          required
                          className="flex-1"
                        />
                        <div className="flex shrink-0 justify-end gap-2">
                          <Button type="button" variant="secondary" onClick={() => setEditingKey(null)}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary">
                            Save
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-sm text-on-surface-muted">
                        {provider.personalKey ? "Configured" : "Not set"}
                      </p>
                    )}
                  </div>

                  {userTeam ? (
                    <div className="pt-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-on-surface-muted">
                          Team{userTeam.isManager ? "" : " (shared)"}
                        </p>
                        {userTeam.isManager && editingKey !== provider.teamEdit ? (
                          <Button
                            variant="secondary"
                            className="h-auto px-3 py-1.5 text-xs"
                            onClick={() => setEditingKey(provider.teamEdit)}
                          >
                            {provider.teamKey ? "Edit" : "Add"}
                          </Button>
                        ) : null}
                      </div>
                      {userTeam.isManager && editingKey === provider.teamEdit ? (
                        <form
                          action={(formData) => {
                            setConfirmAction({ type: "save_team_keys", formData });
                          }}
                          className="flex flex-col gap-3 sm:flex-row"
                        >
                          <input type="hidden" name="teamId" value={userTeam.teamId} />
                          <Input
                            name={provider.teamName}
                            type="password"
                            defaultValue={provider.teamKey ?? ""}
                            placeholder={provider.placeholder}
                            required
                            className="flex-1"
                          />
                          <div className="flex shrink-0 justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setEditingKey(null)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" variant="primary">
                              Save
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-sm text-on-surface-muted">
                          {provider.teamKey ? "Configured" : "Not set"}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
