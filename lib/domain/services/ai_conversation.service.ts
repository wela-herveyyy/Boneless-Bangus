import type {
  AiConversationListItem,
  AiMessagePage,
  AiResult,
} from "@/lib/entities/ai.type";
import { listConversations as listConversationsUseCase } from "../usecases/ai/list_conversations.usecase";
import { listConversationMessages as listConversationMessagesUseCase } from "../usecases/ai/list_conversation_messages.usecase";
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
  opts?: { limit?: number; before?: number },
): Promise<AiResult<AiMessagePage>> {
  return listConversationMessagesUseCase(userId, conversationId, opts);
}

export async function insertAiMessage(
  input: InsertAiMessageInput,
): Promise<AiResult<InsertAiMessageOutput>> {
  return insertAiMessageUseCase(input);
}
