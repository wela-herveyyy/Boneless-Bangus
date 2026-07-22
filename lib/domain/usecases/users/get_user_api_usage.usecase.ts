import { count, eq, sql, sum } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiMessage } from "@/database/schema";
import type { UserApiUsage, UserResult } from "@/lib/entities/users.type";

const EMPTY_USAGE: UserApiUsage = {
  conversationCount: 0,
  promptCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: "0.00",
};

export async function getUserApiUsage(userId: string): Promise<UserResult<UserApiUsage>> {
  const id = userId.trim();
  if (!id) {
    return { ok: false, error: "User id is required." };
  }

  try {
    const [conversationRow] = await database
      .select({ conversationCount: count(aiConversation.id) })
      .from(aiConversation)
      .where(eq(aiConversation.userId, id));

    const [usageRow] = await database
      .select({
        promptCount: count(aiMessage.id),
        inputTokens: sum(aiMessage.inputTokens),
        outputTokens: sum(aiMessage.outputTokens),
        totalCost: sql<string>`coalesce(sum(${aiMessage.cost}), 0)`,
      })
      .from(aiMessage)
      .innerJoin(aiConversation, eq(aiMessage.conversationId, aiConversation.id))
      .where(eq(aiConversation.userId, id));

    const inputTokens = Number(usageRow?.inputTokens ?? 0);
    const outputTokens = Number(usageRow?.outputTokens ?? 0);
    const totalCostRaw = usageRow?.totalCost ?? "0";
    const totalCost = Number(totalCostRaw).toFixed(2);

    return {
      ok: true,
      data: {
        conversationCount: Number(conversationRow?.conversationCount ?? 0),
        promptCount: Number(usageRow?.promptCount ?? 0),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        totalCost,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load API usage.",
    };
  }
}

export { EMPTY_USAGE };
