"use client";

import Link from "next/link";
import { LuArchive, LuFishSymbol, LuLogOut, LuMessageSquare, LuPanelLeftClose, LuPanelLeftOpen, LuSettings } from "react-icons/lu";
import { ArchiveChatModal } from "@/components/molecules/ArchiveChatModal/ArchiveChatModal";
import { Button } from "@/components/atoms/Button/Button";
import { signOutAction } from "@/lib/domain/actions/auth.actions";
import { formatChatDate, getInitials, type ChatHistoryItem } from "./workspaceSidebar.hooks";

type WorkspaceSidebarControls = {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  startNewChat: () => void;
  chatToArchiveId?: string | null;
  promptArchive?: (id: string) => void;
  cancelArchive?: () => void;
  confirmArchive?: () => void;
  isProfileOpen?: boolean;
  openProfile?: () => void;
  closeProfile?: () => void;
};

type WorkspaceSidebarProps = {
  displayName: string;
  userEmail: string;
  sidebar: WorkspaceSidebarControls;
};

export function WorkspaceSidebar({ displayName, userEmail, sidebar }: WorkspaceSidebarProps) {
  const {
    isOpen,
    openSidebar,
    closeSidebar,
    chatHistory,
    activeChatId,
    setActiveChatId,
    startNewChat,
    chatToArchiveId,
    promptArchive,
    cancelArchive,
    confirmArchive,
    openProfile,
  } = sidebar;

  return (
    <>
      <aside
        aria-hidden={!isOpen}
        className={[
          "fixed left-0 top-0 z-20 flex h-screen w-72 flex-col bg-surface-container-low/70 backdrop-blur-[20px] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
              <LuFishSymbol className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-on-surface">BBAI</p>
              <p className="text-xs text-on-surface-muted">Chat history</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:bg-surface-container-highest hover:text-on-surface"
            aria-label="Hide sidebar"
          >
            <LuPanelLeftClose className="size-4" aria-hidden />
          </button>
        </div>

        <div className="px-3 pb-3">
          <Button type="button" variant="secondary" className="w-full" onClick={startNewChat}>
            New chat
          </Button>
        </div>

        <div className="bbai-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {chatHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-muted">
                <LuMessageSquare className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-on-surface">No conversations yet</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">
                Your chats with BBAI will show up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {chatHistory.map((chat) => {
                const isActive = chat.id === activeChatId;

                return (
                  <li key={chat.id} className="group relative flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveChatId(chat.id)}
                      className={[
                        "w-full rounded-xl px-3 py-3 text-left transition-colors flex-1",
                        isActive
                          ? "bg-surface-container-high text-on-surface"
                          : "text-on-surface-muted hover:bg-surface-container-high/60 hover:text-on-surface",
                      ].join(" ")}
                    >
                      <span className="block truncate pr-6 text-sm font-medium">{chat.title}</span>
                      <span className="mt-1 block text-xs text-on-surface-muted">
                        {formatChatDate(chat.updatedAt)}
                      </span>
                    </button>
                    {promptArchive && (
                      <button
                        type="button"
                        onClick={() => promptArchive(chat.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex p-2 rounded-lg text-on-surface-muted hover:text-red-400 hover:bg-surface-container-highest transition-colors"
                        aria-label="Archive chat"
                      >
                        <LuArchive className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3 p-4">
          <button 
            type="button" 
            onClick={openProfile}
            className="w-full text-left block rounded-2xl bg-surface-container-high/80 p-4 transition-colors hover:bg-surface-container-highest"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                {getInitials(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">{displayName}</p>
                <p className="truncate text-xs text-on-surface-muted">{userEmail}</p>
              </div>
            </div>
          </button>

          <div className="flex flex-col gap-2">
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" className="w-full gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                <LuLogOut className="size-4" aria-hidden />
                Log out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {!isOpen ? (
        <button
          type="button"
          onClick={openSidebar}
          className="fixed left-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-muted shadow-bloom transition-colors hover:text-primary"
          aria-label="Show sidebar"
        >
          <LuPanelLeftOpen className="size-4" aria-hidden />
        </button>
      ) : null}

      {cancelArchive && confirmArchive && (
        <ArchiveChatModal
          isOpen={!!chatToArchiveId}
          onCancel={cancelArchive}
          onConfirm={confirmArchive}
        />
      )}
    </>
  );
}

export function WorkspaceSidebarFallback() {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-72 flex-col bg-surface-container-low/70 backdrop-blur-[20px]">
      <div className="px-5 py-5">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="flex-1 space-y-2 px-3">
        <div className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-20 animate-pulse rounded-2xl bg-surface-container-high" />
        <div className="h-12 animate-pulse rounded-2xl bg-surface-container-high" />
      </div>
    </aside>
  );
}
