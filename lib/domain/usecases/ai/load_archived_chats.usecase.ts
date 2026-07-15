export const ARCHIVE_STORAGE_KEY = "bbai_archived_chats";
export let archivedChatsCache: Set<string> | null = null;

export function loadArchivedChats(): Set<string> {
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
