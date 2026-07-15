import { loadArchivedChats, ARCHIVE_STORAGE_KEY } from "./load_archived_chats.usecase";

export function archiveChatLocally(chatId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const cache = loadArchivedChats();
  if (!cache.has(chatId)) {
    cache.add(chatId);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(Array.from(cache)));
  }
}
