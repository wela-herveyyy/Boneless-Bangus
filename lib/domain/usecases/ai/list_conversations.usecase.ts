import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiMessage } from "@/database/schema";
import type { AiConversationListItem, AiKeySource, AiResult } from "@/lib/entities/ai.type";

function titleFromContent(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return "New chat";
  return flat.length > 48 ? `${flat.slice(0, 48)}…` : flat;
}

function asKeySource(value: string | null): AiKeySource | null {
  if (value === "personal" || value === "team" || value === "system") return value;
  return null;
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
        keySource: aiMessage.keySource,
      })
      .from(aiMessage)
      .where(inArray(aiMessage.conversationId, ids))
      .orderBy(asc(aiMessage.rowPosition));

    const usageRows = await database
      .select({
        conversationId: aiMessage.conversationId,
        promptCount: sql<number>`count(${aiMessage.id})`,
        inputTokens: sql<string>`coalesce(sum(${aiMessage.inputTokens}), 0)`,
        outputTokens: sql<string>`coalesce(sum(${aiMessage.outputTokens}), 0)`,
        totalCost: sql<string>`coalesce(sum(${aiMessage.cost}), 0)`,
      })
      .from(aiMessage)
      .where(inArray(aiMessage.conversationId, ids))
      .groupBy(aiMessage.conversationId);

    const firstByConvo = new Map<string, string>();
    const keySourcesByConvo = new Map<string, Set<AiKeySource>>();
    for (const msg of messages) {
      if (!firstByConvo.has(msg.conversationId)) {
        firstByConvo.set(msg.conversationId, msg.content);
      }
      const source = asKeySource(msg.keySource);
      if (!source) continue;
      const set = keySourcesByConvo.get(msg.conversationId) ?? new Set<AiKeySource>();
      set.add(source);
      keySourcesByConvo.set(msg.conversationId, set);
    }

    const usageByConvo = new Map(
      usageRows.map((row) => {
        const inputTokens = Number(row.inputTokens ?? 0);
        const outputTokens = Number(row.outputTokens ?? 0);
        return [
          row.conversationId,
          {
            promptCount: Number(row.promptCount ?? 0),
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            cost: Number(row.totalCost ?? 0).toFixed(2),
          },
        ] as const;
      }),
    );

    return {
      ok: true,
      data: convos.map((c) => {
        const usage = usageByConvo.get(c.id);
        return {
          id: c.id,
          title: titleFromContent(firstByConvo.get(c.id) ?? "New chat"),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          promptCount: usage?.promptCount ?? 0,
          inputTokens: usage?.inputTokens ?? 0,
          outputTokens: usage?.outputTokens ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
          cost: usage?.cost ?? "0.00",
          keySources: [...(keySourcesByConvo.get(c.id) ?? [])],
        };
      }),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to list conversations.",
    };
  }
}
