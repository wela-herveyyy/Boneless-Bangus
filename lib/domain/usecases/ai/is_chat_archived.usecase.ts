import { loadArchivedChats } from "@/lib/domain/services/archive_storage.service";

export function isChatArchived(chatId: string): boolean {
  return loadArchivedChats().has(chatId);
}
