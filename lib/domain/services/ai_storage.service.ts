const ARCHIVE_STORAGE_KEY = "bbai_archived_chats";
let archivedChatsCache: Set<string> | null = null;

export function loadArchivedChatsService(): Set<string> {
  if (archivedChatsCache) {
    return archivedChatsCache;
  }
  
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const stored = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      archivedChatsCache = new Set(parsed);
      return archivedChatsCache;
    }
  } catch (e) {
    // Ignore parsing errors
  }

  archivedChatsCache = new Set();
  return archivedChatsCache;
}

export function isChatArchivedService(chatId: string): boolean {
  return loadArchivedChatsService().has(chatId);
}

export function archiveChatLocallyService(chatId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const cache = loadArchivedChatsService();
  if (!cache.has(chatId)) {
    cache.add(chatId);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(Array.from(cache)));
  }
}
