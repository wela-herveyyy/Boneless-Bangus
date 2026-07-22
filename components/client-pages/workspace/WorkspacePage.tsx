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
import { ProfileView } from "@/components/client-pages/profile/ProfileView";
import type { UserRole } from "@/lib/entities/users.type";

type WorkspacePageProps = {
  userId: string;
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
  showAdminLink?: boolean;
  userRole?: UserRole | null;
};

export function WorkspacePage({
  userId,
  userName,
  userEmail,
  userSettings,
  userTeam,
  showAdminLink = false,
  userRole = null,
}: WorkspacePageProps) {
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
      <WorkspaceSidebar
        displayName={displayName}
        userEmail={userEmail}
        sidebar={sidebar}
        showAdminLink={showAdminLink}
        userRole={userRole}
      />
      <WorkspaceChat
        userEmail={userEmail}
        displayName={displayName}
        profile={profile}
        loading={loading}
        sidebarOpen={sidebar.isOpen}
        activeChatId={sidebar.activeChatId}
        onConversationSaved={onConversationSaved}
      />
      {sidebar.isProfileOpen && (
        <ProfileView
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userSettings={userSettings}
          userTeam={userTeam}
          onClose={sidebar.closeProfile}
        />
      )}
    </div>
  );
}

export function WorkspacePageFallback() {
  return (
    <div className="relative h-screen overflow-hidden bg-surface flex">
      <FuturisticBackdrop />
      <WorkspaceSidebarFallback />
      <WorkspaceChatFallback />
    </div>
  );
}
