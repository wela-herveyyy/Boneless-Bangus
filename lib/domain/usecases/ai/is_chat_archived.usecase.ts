import { loadArchivedChats } from "./load_archived_chats.usecase";

export function isChatArchived(chatId: string): boolean {
  return loadArchivedChats().has(chatId);
}
