"use client";

import { useActionState, useState, startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { updateApiKeysAction, joinTeamAction, leaveTeamAction, updatePersonalInfoAction } from "@/lib/domain/actions/profile.actions";

type ProfileViewProps = {
  userName: string;
  userEmail: string;
  userSettings: {
    cursorApiKey: string | null;
    geminiApiKey: string | null;
  } | null;
  userTeam: {
    teamCode: string;
    teamName: string;
  } | null;
  onClose?: () => void;
};

type ConfirmState = {
  type: "save_keys" | "join_team" | "leave_team" | "save_personal_info";
  formData: FormData;
} | null;

export function ProfileView({ userName, userEmail, userSettings, userTeam, onClose }: ProfileViewProps) {
  const router = useRouter();
  const [personalInfoState, personalInfoAction] = useActionState(updatePersonalInfoAction, null);
  const [apiKeyState, apiKeysFormAction] = useActionState(updateApiKeysAction, null);
  const [joinState, joinFormAction] = useActionState(joinTeamAction, null);
  const [leaveState, leaveFormAction] = useActionState(leaveTeamAction, null);

  const [confirmAction, setConfirmAction] = useState<ConfirmState>(null);
  const [editingKey, setEditingKey] = useState<"gemini" | "cursor" | "personal_info" | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (apiKeyState?.ok) setFeedback({ type: 'success', message: "API keys updated successfully." });
    else if (apiKeyState?.error) setFeedback({ type: 'error', message: apiKeyState.error });
  }, [apiKeyState]);

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
      if (type === "join_team") joinFormAction(formData);
      if (type === "leave_team") leaveFormAction(formData);
      if (type === "save_personal_info") personalInfoAction(formData);
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
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
                    <p className="text-sm font-medium text-primary mb-1">Current Team</p>
                    <p className="text-lg font-semibold text-on-surface">{userTeam.teamName}</p>
                    <p className="text-sm text-on-surface-muted font-mono">Code: {userTeam.teamCode}</p>
                  </div>
                  <form action={(formData) => setConfirmAction({ type: "leave_team", formData })}>
                    <Button type="submit" variant="danger">
                      Leave Team
                    </Button>
                  </form>
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

            {/* API Keys Section */}
            <section className="rounded-2xl border border-outline-variant bg-surface-container p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-on-surface">LLM API Keys</h2>
              <p className="mb-5 text-sm text-on-surface-muted">
                Provide your personal API keys to use Language Models directly within the workspace. These keys are stored securely.
              </p>

              <div className="space-y-4">
                {/* Gemini API Key */}
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-on-surface font-semibold mb-0">Gemini API Key</Label>
                    {!editingKey || editingKey !== "gemini" ? (
                      <Button variant="secondary" className="px-3 py-1.5 text-xs h-auto" onClick={() => setEditingKey("gemini")}>
                        {userSettings?.geminiApiKey ? "Edit Key" : "Add Key"}
                      </Button>
                    ) : null}
                  </div>
                  
                  {editingKey === "gemini" ? (
                    <form action={(formData) => { setEditingKey(null); setConfirmAction({ type: "save_keys", formData }); }} className="flex flex-col sm:flex-row gap-3 mt-3">
                      <Input
                        id="geminiApiKey"
                        name="geminiApiKey"
                        type="password"
                        defaultValue={userSettings?.geminiApiKey ?? ""}
                        placeholder="AIzaSy..."
                        required
                        className="flex-1"
                      />
                      <div className="flex gap-2 justify-end sm:justify-start shrink-0">
                        <Button type="button" variant="secondary" onClick={() => setEditingKey(null)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save</Button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-on-surface-muted flex items-center gap-2">
                      <span className={`inline-block size-2 rounded-full ${userSettings?.geminiApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                      {userSettings?.geminiApiKey ? "Key configured" : "Not configured"}
                    </p>
                  )}
                </div>

                {/* Cursor API Key */}
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-on-surface font-semibold mb-0">Cursor API Key</Label>
                    {!editingKey || editingKey !== "cursor" ? (
                      <Button variant="secondary" className="px-3 py-1.5 text-xs h-auto" onClick={() => setEditingKey("cursor")}>
                        {userSettings?.cursorApiKey ? "Edit Key" : "Add Key"}
                      </Button>
                    ) : null}
                  </div>
                  
                  {editingKey === "cursor" ? (
                    <form action={(formData) => { setEditingKey(null); setConfirmAction({ type: "save_keys", formData }); }} className="flex flex-col sm:flex-row gap-3 mt-3">
                      <Input
                        id="cursorApiKey"
                        name="cursorApiKey"
                        type="password"
                        defaultValue={userSettings?.cursorApiKey ?? ""}
                        placeholder="Enter your Cursor API key"
                        required
                        className="flex-1"
                      />
                      <div className="flex gap-2 justify-end sm:justify-start shrink-0">
                        <Button type="button" variant="secondary" onClick={() => setEditingKey(null)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save</Button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-on-surface-muted flex items-center gap-2">
                      <span className={`inline-block size-2 rounded-full ${userSettings?.cursorApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                      {userSettings?.cursorApiKey ? "Key configured" : "Not configured"}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-display font-semibold text-on-surface mb-2">
              {confirmAction.type === "save_keys" && "Save API Keys?"}
              {confirmAction.type === "save_personal_info" && "Save Personal Info?"}
              {confirmAction.type === "join_team" && "Join Team?"}
              {confirmAction.type === "leave_team" && "Leave Team?"}
            </h3>
            <p className="text-sm text-on-surface-muted mb-6">
              {confirmAction.type === "save_keys" && "Are you sure you want to update your API keys?"}
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
