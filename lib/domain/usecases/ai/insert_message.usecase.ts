import { eq, max } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiMessage } from "@/database/schema";
import type { AiKeySource, AiResult, AiUsageMetrics } from "@/lib/entities/ai.type";

export type InsertAiMessageInput = {
  userId: string;
  /** Existing ai_conversation.id — created when omitted. */
  conversationId?: string;
  /** User prompt. */
  content: string;
  /** Agent/model reply. */
  aiFeedback: string;
  usage?: AiUsageMetrics;
  /** Which API key funded this turn. */
  keySource?: AiKeySource;
};

export type InsertAiMessageOutput = {
  conversationId: string;
  messageId: string;
  rowPosition: number;
};

const ZERO_USAGE: AiUsageMetrics = {
  inputTokens: 0,
  outputTokens: 0,
  cost: "0.00",
};

export async function insertAiMessage(
  input: InsertAiMessageInput,
): Promise<AiResult<InsertAiMessageOutput>> {
  const content = input.content.trim();
  const aiFeedback = input.aiFeedback.trim();
  if (!content) {
    return { ok: false, error: "Message content is required." };
  }
  if (!aiFeedback) {
    return { ok: false, error: "AI feedback is required." };
  }

  try {
    let conversationId = input.conversationId?.trim();

    if (!conversationId) {
      conversationId = crypto.randomUUID();
      await database.insert(aiConversation).values({
        id: conversationId,
        userId: input.userId,
      });
    } else {
      const [owned] = await database
        .select({ userId: aiConversation.userId })
        .from(aiConversation)
        .where(eq(aiConversation.id, conversationId))
        .limit(1);

      if (!owned || owned.userId !== input.userId) {
        return { ok: false, error: "Conversation not found." };
      }

      await database
        .update(aiConversation)
        .set({ updatedAt: new Date() })
        .where(eq(aiConversation.id, conversationId));
    }

    const [pos] = await database
      .select({ maxPos: max(aiMessage.rowPosition) })
      .from(aiMessage)
      .where(eq(aiMessage.conversationId, conversationId));

    const rowPosition = (pos?.maxPos ?? -1) + 1;
    const messageId = crypto.randomUUID();
    const usage = input.usage ?? ZERO_USAGE;

    await database.insert(aiMessage).values({
      id: messageId,
      conversationId,
      rowPosition,
      content,
      aiFeedback,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost,
      keySource: input.keySource ?? null,
    });

    return {
      ok: true,
      data: { conversationId, messageId, rowPosition },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to insert AI message.",
    };
  }
}
