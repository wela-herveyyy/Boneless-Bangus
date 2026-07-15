import { loadArchivedChats, ARCHIVE_STORAGE_KEY } from "@/lib/domain/services/archive_storage.service";

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
