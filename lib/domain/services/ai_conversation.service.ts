import type {
  AiConversationListItem,
  AiMessageItem,
  AiResult,
} from "@/lib/entities/ai.type";
import {
  listConversationMessages as listConversationMessagesUseCase,
  listConversations as listConversationsUseCase,
} from "../usecases/ai/list_conversations.usecase";
import {
  insertAiMessage as insertAiMessageUseCase,
  type InsertAiMessageInput,
  type InsertAiMessageOutput,
} from "../usecases/ai/insert_message.usecase";

export async function listConversations(
  userId: string,
): Promise<AiResult<AiConversationListItem[]>> {
  return listConversationsUseCase(userId);
}

export async function listConversationMessages(
  userId: string,
  conversationId: string,
): Promise<AiResult<AiMessageItem[]>> {
  return listConversationMessagesUseCase(userId, conversationId);
}

export async function insertAiMessage(
  input: InsertAiMessageInput,
): Promise<AiResult<InsertAiMessageOutput>> {
  return insertAiMessageUseCase(input);
}
