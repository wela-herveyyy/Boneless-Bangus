"use client";

import { FuturisticBackdrop } from "@/components/molecules/FuturisticBackdrop/FuturisticBackdrop";
import { WorkspaceChat, WorkspaceChatFallback } from "@/components/organisms/Workspace-Chat/WorkspaceChat";
import {
  getDisplayName,
  useWorkspaceProfile,
} from "@/components/organisms/Workspace-Chat/workspaceChat.hooks";
import { useWorkspaceSidebar } from "@/components/organisms/Workspace-Sidebar/workspaceSidebar.hooks";
import {
  WorkspaceSidebar,
  WorkspaceSidebarFallback,
} from "@/components/organisms/Workspace-Sidebar/WorkspaceSidebar";

type WorkspacePageProps = {
  userName: string;
  userEmail: string;
};

export function WorkspacePage({ userName, userEmail }: WorkspacePageProps) {
  const sidebar = useWorkspaceSidebar();
  const { profile, loading } = useWorkspaceProfile();
  const displayName = getDisplayName(profile, userName);

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <FuturisticBackdrop />
      <WorkspaceSidebar displayName={displayName} userEmail={userEmail} sidebar={sidebar} />
      <WorkspaceChat
        userEmail={userEmail}
        displayName={displayName}
        profile={profile}
        loading={loading}
        sidebarOpen={sidebar.isOpen}
      />
    </div>
  );
}

export function WorkspacePageFallback() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <FuturisticBackdrop />
      <WorkspaceSidebarFallback />
      <WorkspaceChatFallback />
    </div>
  );
}
