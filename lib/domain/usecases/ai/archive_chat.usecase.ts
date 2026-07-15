const STORAGE_KEY = "bbai_archived_chats";
let archivedChatsCache: Set<string> | null = null;

function loadArchivedChats(): Set<string> {
  if (archivedChatsCache) {
    return archivedChatsCache;
  }
  
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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

export function isChatArchived(chatId: string): boolean {
  return loadArchivedChats().has(chatId);
}

export function archiveChatLocally(chatId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const cache = loadArchivedChats();
  if (!cache.has(chatId)) {
    cache.add(chatId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cache)));
  }
}
