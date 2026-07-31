"use client";

import Link from "next/link";
import {
  LuArchive,
  LuFishSymbol,
  LuLayers2,
  LuLogOut,
  LuMessageSquare,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuShield,
  LuUsersRound,
} from "react-icons/lu";
import { ArchiveChatModal } from "@/components/molecules/ArchiveChatModal/ArchiveChatModal";
import { Button } from "@/components/atoms/Button/Button";
import { signOutAction } from "@/lib/domain/actions/auth.actions";
import type { UserRole } from "@/lib/entities/users.type";
import { labelForCanvasTool, type OutputCanvasItem } from "@/lib/entities/output_canvas.type";
import { getRoleLabel } from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { formatChatDate, getInitials, type ChatHistoryItem } from "./workspaceSidebar.hooks";

type WorkspaceSidebarControls = {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  chatHistory: ChatHistoryItem[];
  canvases?: OutputCanvasItem[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  startNewChat: () => void;
  chatToArchiveId?: string | null;
  promptArchive?: (id: string) => void;
  cancelArchive?: () => void;
  confirmArchive?: () => void;
  isProfileOpen?: boolean;
  openProfile?: (section?: "account" | "theme" | "skills" | "tools") => void;
  closeProfile?: () => void;
  openCanvas?: (canvas: OutputCanvasItem) => void;
  sidebarTab?: "chats" | "canvases";
  setSidebarTab?: (tab: "chats" | "canvases") => void;
};

type WorkspaceSidebarProps = {
  displayName: string;
  userEmail: string;
  sidebar: WorkspaceSidebarControls;
  showAdminLink?: boolean;
  userRole?: UserRole | null;
};

export function WorkspaceSidebar({
  displayName,
  userEmail,
  sidebar,
  showAdminLink = false,
  userRole = null,
}: WorkspaceSidebarProps) {
  const {
    isOpen,
    openSidebar,
    closeSidebar,
    chatHistory,
    canvases = [],
    activeChatId,
    setActiveChatId,
    startNewChat,
    chatToArchiveId,
    promptArchive,
    cancelArchive,
    confirmArchive,
    openProfile,
    openCanvas,
    sidebarTab = "chats",
    setSidebarTab,
  } = sidebar;

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-30 bg-on-surface/20 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={closeSidebar}
        inert={!isOpen ? true : undefined}
      />
      <aside
        inert={!isOpen ? true : undefined}
        className={[
          "fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-surface-container-low/70 backdrop-blur-[20px] transition-transform duration-300 ease-out",
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
          <div className="mt-3 flex gap-1 rounded-2xl bg-surface-container-high/70 p-1">
            {(
              [
                { id: "chats" as const, label: "Chats" },
                { id: "canvases" as const, label: "Canvas" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSidebarTab?.(tab.id)}
                className={[
                  "flex-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
                  sidebarTab === tab.id
                    ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                    : "text-on-surface-muted hover:text-on-surface",
                ].join(" ")}
              >
                {tab.label}
                {tab.id === "canvases" && canvases.length > 0 ? (
                  <span className="ml-1 text-[10px] text-primary">{canvases.length}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="bbai-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {sidebarTab === "canvases" ? (
            canvases.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-muted">
                  <LuLayers2 className="size-5" aria-hidden />
                </span>
                <p className="text-sm font-medium text-on-surface">No canvases yet</p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">
                  Generate a Web Page, Web Form, or Print Format — one canvas per chat.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {canvases.map((canvas) => {
                  const isActive = canvas.conversationId === activeChatId;
                  return (
                    <li key={canvas.id}>
                      <button
                        type="button"
                        onClick={() => openCanvas?.(canvas)}
                        className={[
                          "w-full rounded-xl px-3 py-3 text-left transition-colors",
                          isActive
                            ? "bg-surface-container-high text-on-surface"
                            : "text-on-surface-muted hover:bg-surface-container-high/60 hover:text-on-surface",
                        ].join(" ")}
                      >
                        <span className="block truncate text-sm font-medium">{canvas.title}</span>
                        <span className="mt-1 flex items-center gap-2 text-[11px] text-on-surface-muted">
                          <span className="font-mono text-primary">{canvas.id}</span>
                          <span>·</span>
                          <span>{labelForCanvasTool(canvas.toolMode)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : chatHistory.length === 0 ? (
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
                const canvas = canvases.find((c) => c.conversationId === chat.id);

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
                      <span className="mt-1 flex items-center gap-2 text-xs text-on-surface-muted">
                        <span>{formatChatDate(chat.updatedAt)}</span>
                        {canvas ? (
                          <>
                            <span>·</span>
                            <span className="font-mono text-[10px] text-primary">{canvas.id}</span>
                          </>
                        ) : null}
                      </span>
                    </button>
                    {promptArchive && (
                      <button
                        type="button"
                        onClick={() => promptArchive(chat.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex md:hidden md:group-hover:flex p-2 rounded-lg text-on-surface-muted hover:text-red-400 hover:bg-surface-container-highest transition-colors"
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
          {showAdminLink ? (
            <div className="rounded-2xl bg-linear-to-br from-primary/12 via-surface-container-lowest to-surface-container-lowest p-3 shadow-bloom">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Administration
              </p>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl bg-surface-container-lowest/90 px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-white"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LuShield className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">Control center</span>
                  <span className="block truncate text-[11px] font-normal text-on-surface-muted">
                    Users, teams & access
                  </span>
                </span>
                <LuUsersRound className="size-4 shrink-0 text-on-surface-muted" aria-hidden />
              </Link>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => openProfile?.()}
            className="block w-full rounded-2xl bg-surface-container-high/80 p-4 text-left transition-colors hover:bg-surface-container-highest"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                {getInitials(displayName)}
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-on-surface">{displayName}</p>
                  {userRole ? (
                    <span className="shrink-0 rounded-md bg-tertiary/10 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-tertiary">
                      {getRoleLabel(userRole)}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-on-surface-muted">{userEmail}</p>
              </div>
            </div>
          </button>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="secondary"
              className="w-full gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LuLogOut className="size-4" aria-hidden />
              Log out
            </Button>
          </form>
        </div>
      </aside>

      <button
        type="button"
        onClick={openSidebar}
        className={[
          "fixed left-4 top-16 md:top-1/2 z-40 flex size-10 md:-translate-y-1/2 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-muted shadow-bloom hover:text-primary",
          isOpen
            ? "pointer-events-none opacity-0 -translate-x-4 transition-all duration-200"
            : "pointer-events-auto opacity-100 translate-x-0 transition-all duration-300 delay-150"
        ].join(" ")}
        aria-label="Show sidebar"
      >
        <LuPanelLeftOpen className="size-4" aria-hidden />
      </button>

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
