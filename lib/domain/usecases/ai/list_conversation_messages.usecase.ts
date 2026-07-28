import { and, desc, eq, lt } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiMessage } from "@/database/schema";
import type { AiKeySource, AiMessageItem, AiMessagePage, AiResult } from "@/lib/entities/ai.type";

const DEFAULT_PAGE = 20;

function asKeySource(value: string | null): AiKeySource | null {
  if (value === "personal" || value === "team" || value === "system") return value;
  return null;
}

function mapRow(row: typeof aiMessage.$inferSelect): AiMessageItem {
  return {
    id: row.id,
    conversationId: row.conversationId,
    content: row.content,
    aiFeedback: row.aiFeedback,
    rowPosition: row.rowPosition,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    cost: String(row.cost),
    keySource: asKeySource(row.keySource),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listConversationMessages(
  userId: string,
  conversationId: string,
  opts?: { limit?: number; before?: number },
): Promise<AiResult<AiMessagePage>> {
  const id = conversationId.trim();
  if (!id) {
    return { ok: false, error: "Conversation id is required." };
  }

  const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_PAGE, 1), 50);

  try {
    const [convo] = await database
      .select({ id: aiConversation.id, userId: aiConversation.userId })
      .from(aiConversation)
      .where(eq(aiConversation.id, id))
      .limit(1);

    if (!convo || convo.userId !== userId) {
      return { ok: false, error: "Conversation not found." };
    }

    const where =
      opts?.before != null
        ? and(eq(aiMessage.conversationId, id), lt(aiMessage.rowPosition, opts.before))
        : eq(aiMessage.conversationId, id);

    const rows = await database
      .select()
      .from(aiMessage)
      .where(where)
      .orderBy(desc(aiMessage.rowPosition))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    page.reverse();

    return {
      ok: true,
      data: {
        items: page.map(mapRow),
        hasMore,
        nextBefore: page.length > 0 ? page[0].rowPosition : null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load messages.",
    };
  }
}
