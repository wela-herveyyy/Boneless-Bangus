"use client";

import { useCallback, useEffect } from "react";
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

  const onConversationSaved = useCallback(
    (dbConversationId: string) => {
      sidebar.setActiveChatId(dbConversationId);
      void sidebar.refreshHistory();
    },
    [sidebar.setActiveChatId, sidebar.refreshHistory],
  );

  // Keep the native window scrollbar off so only .bbai-scroll panels scroll.
  useEffect(() => {
    document.documentElement.classList.add("bbai-lock-scroll");
    return () => {
      document.documentElement.classList.remove("bbai-lock-scroll");
    };
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-surface">
      <FuturisticBackdrop />
      <WorkspaceSidebar displayName={displayName} userEmail={userEmail} sidebar={sidebar} />
      <WorkspaceChat
        userEmail={userEmail}
        displayName={displayName}
        profile={profile}
        loading={loading}
        sidebarOpen={sidebar.isOpen}
        activeChatId={sidebar.activeChatId}
        onConversationSaved={onConversationSaved}
      />
    </div>
  );
}

export function WorkspacePageFallback() {
  return (
    <div className="relative h-screen overflow-hidden bg-surface">
      <FuturisticBackdrop />
      <WorkspaceSidebarFallback />
      <WorkspaceChatFallback />
    </div>
  );
}
