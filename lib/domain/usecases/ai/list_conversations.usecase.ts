import { asc, desc, eq, inArray } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiMessage } from "@/database/schema";
import type { AiConversationListItem, AiResult } from "@/lib/entities/ai.type";

function titleFromContent(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return "New chat";
  return flat.length > 48 ? `${flat.slice(0, 48)}…` : flat;
}

export async function listConversations(
  userId: string,
): Promise<AiResult<AiConversationListItem[]>> {
  try {
    const convos = await database
      .select({
        id: aiConversation.id,
        createdAt: aiConversation.createdAt,
        updatedAt: aiConversation.updatedAt,
      })
      .from(aiConversation)
      .where(eq(aiConversation.userId, userId))
      .orderBy(desc(aiConversation.updatedAt));

    if (convos.length === 0) {
      return { ok: true, data: [] };
    }

    const ids = convos.map((c) => c.id);
    const messages = await database
      .select({
        conversationId: aiMessage.conversationId,
        content: aiMessage.content,
        rowPosition: aiMessage.rowPosition,
      })
      .from(aiMessage)
      .where(inArray(aiMessage.conversationId, ids))
      .orderBy(asc(aiMessage.rowPosition));

    const firstByConvo = new Map<string, string>();
    for (const msg of messages) {
      if (!firstByConvo.has(msg.conversationId)) {
        firstByConvo.set(msg.conversationId, msg.content);
      }
    }

    return {
      ok: true,
      data: convos.map((c) => ({
        id: c.id,
        title: titleFromContent(firstByConvo.get(c.id) ?? "New chat"),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to list conversations.",
    };
  }
}
