"use client";

import { useActionState, useState, startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { updateApiKeysAction, joinTeamAction, leaveTeamAction, updatePersonalInfoAction } from "@/lib/domain/actions/profile.actions";
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
};

type ConfirmState = {
  type: "save_keys" | "save_team_keys" | "join_team" | "leave_team" | "save_personal_info";
  formData: FormData;
} | null;

export function ProfileView({ userId, userName, userEmail, userSettings, userTeam, onClose }: ProfileViewProps) {
  const router = useRouter();
  const [personalInfoState, personalInfoAction] = useActionState(updatePersonalInfoAction, null);
  const [apiKeyState, apiKeysFormAction] = useActionState(updateApiKeysAction, null);
  const [teamKeyState, teamKeysFormAction] = useActionState(updateTeamApiKeysAction, null);
  const [joinState, joinFormAction] = useActionState(joinTeamAction, null);
  const [leaveState, leaveFormAction] = useActionState(leaveTeamAction, null);

  const [confirmAction, setConfirmAction] = useState<ConfirmState>(null);
  const [editingKey, setEditingKey] = useState<
    "gemini" | "cursor" | "team_gemini" | "team_cursor" | "personal_info" | null
  >(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (apiKeyState?.ok) setFeedback({ type: 'success', message: "API keys updated successfully." });
    else if (apiKeyState?.error) setFeedback({ type: 'error', message: apiKeyState.error });
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
    if (joinState?.ok) setFeedback({ type: 'success', message: "Successfully joined the team." });
    else if (joinState?.error) setFeedback({ type: 'error', message: joinState.error });
  }, [joinState]);

  useEffect(() => {
    if (leaveState?.ok) setFeedback({ type: 'success', message: "Successfully left the team." });
    else if (leaveState?.error) setFeedback({ type: 'error', message: leaveState.error });
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
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
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

  return (
    <>
      <div className="fixed inset-0 z-130 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
        <div
          className="flex w-full max-w-2xl flex-col gap-6 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border max-h-[90vh] overflow-y-auto bbai-scroll"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-title"
        >
          <header className="flex items-start justify-between">
            <div>
              <h1 id="profile-settings-title" className="text-2xl font-display font-bold text-on-surface">Profile Settings</h1>
              <p className="mt-1 text-sm text-on-surface-muted">Manage your API keys and team affiliations.</p>
              {userId ? (
                <Link
                  href={`/user/${userId}`}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  View full profile, usage & prompt archives
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
              aria-label="Close modal"
            >
              <LuX className="size-5" />
            </button>
          </header>

          {feedback && (
            <div className={`rounded-xl p-4 text-sm font-medium ${feedback.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {feedback.message}
            </div>
          )}

          <div className="grid gap-6">
            {/* Personal Info Section */}
            <section className="rounded-2xl border border-outline-variant bg-surface-container p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Personal Information</h2>
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-on-surface font-semibold mb-0">Your Details</Label>
                    <p className="text-sm text-on-surface-muted">Manage your personal information.</p>
                  </div>
                  {!editingKey || editingKey !== "personal_info" ? (
                    <Button variant="secondary" className="px-3 py-1.5 text-xs h-auto" onClick={() => setEditingKey("personal_info")}>
                      Edit Info
                    </Button>
                  ) : null}
                </div>

                {editingKey === "personal_info" ? (
                  <form action={(formData) => { setConfirmAction({ type: "save_personal_info", formData }); }} className="flex flex-col gap-4 mt-3 border-t border-outline-variant pt-4">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={userName}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={userEmail}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="secondary" onClick={() => setEditingKey(null)}>Cancel</Button>
                      <Button type="submit" variant="primary">Save Changes</Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-3 border-t border-outline-variant pt-4">
                    <div>
                      <p className="text-sm font-medium text-on-surface-muted">Name</p>
                      <p className="text-base text-on-surface">{userName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface-muted">Email</p>
                      <p className="text-base text-on-surface">{userEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Team Section */}
            <section className="rounded-2xl border border-outline-variant bg-surface-container p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Team Configuration</h2>

              {userTeam ? (
                <div className="mb-4 rounded-xl bg-primary/10 p-4 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">
                      Current Team{userTeam.isManager ? " · Team Leader" : ""}
                    </p>
                    <p className="text-lg font-semibold text-on-surface">{userTeam.teamName}</p>
                    <p className="text-sm text-on-surface-muted font-mono">Code: {userTeam.teamCode}</p>
                    {userTeam.isManager ? (
                      <p className="mt-2 text-xs text-on-surface-muted">
                        As team leader you manage shared API keys and cannot leave this team.
                      </p>
                    ) : null}
                  </div>
                  {!userTeam.isManager ? (
                    <form action={(formData) => setConfirmAction({ type: "leave_team", formData })}>
                      <Button type="submit" variant="danger">
                        Leave Team
                      </Button>
                    </form>
                  ) : null}
                </div>
              ) : (
                <div className="mb-4 rounded-xl bg-surface-container-high p-4">
                  <p className="text-sm text-on-surface-muted">You are not currently assigned to a team.</p>
                </div>
              )}

              {!userTeam && (
                <form action={(formData) => setConfirmAction({ type: "join_team", formData })} className="space-y-4 border-t border-outline-variant pt-4 mt-2">
                  <div className="space-y-2">
                    <Label>Join Team</Label>
                    <div className="flex gap-3">
                      <Input
                        id="teamCode"
                        name="teamCode"
                        placeholder="Enter 6-digit team code"
                        maxLength={6}
                        required
                        className="flex-1"
                      />
                      <Button type="submit">Join Team</Button>
                    </div>
                    <p className="text-xs text-on-surface-muted">
                      Enter a team code to join an existing team.
                    </p>
                  </div>
                </form>
              )}

            </section>

            {/* API Keys — personal + team (managers) in one place */}
            <section className="rounded-2xl border border-outline-variant bg-surface-container p-5 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-on-surface">API Keys</h2>
              <p className="mb-5 text-sm text-on-surface-muted">
                {userTeam
                  ? "Personal keys override the team key. Members without a personal key use the team key."
                  : "Keys are stored securely and used for Language Models in the workspace."}
              </p>

              <div className="space-y-4">
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
                      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <Label className="mb-0 font-semibold text-on-surface">{provider.label}</Label>
                        <p className="flex items-center gap-2 text-xs text-on-surface-muted">
                          <span
                            className={`inline-block size-2 rounded-full ${active === "none" ? "bg-red-500" : "bg-green-500"
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
                          <div className="border-t border-outline-variant pt-3">
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
            </section>
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-140 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-display font-semibold text-on-surface mb-2">
              {confirmAction.type === "save_keys" && "Save API Keys?"}
              {confirmAction.type === "save_team_keys" && "Save Team API Keys?"}
              {confirmAction.type === "save_personal_info" && "Save Personal Info?"}
              {confirmAction.type === "join_team" && "Join Team?"}
              {confirmAction.type === "leave_team" && "Leave Team?"}
            </h3>
            <p className="text-sm text-on-surface-muted mb-6">
              {confirmAction.type === "save_keys" && "Are you sure you want to update your API keys?"}
              {confirmAction.type === "save_team_keys" &&
                "These keys are shared with team members who do not have a personal key."}
              {confirmAction.type === "save_personal_info" && "Are you sure you want to update your personal information?"}
              {confirmAction.type === "join_team" && "Are you sure you want to join this team?"}
              {confirmAction.type === "leave_team" && "Are you sure you want to leave your current team?"}
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                type="button"
                variant={confirmAction.type === "leave_team" ? "danger" : "primary"}
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
