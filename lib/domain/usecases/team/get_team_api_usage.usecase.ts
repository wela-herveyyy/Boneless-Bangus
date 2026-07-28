import { and, count, countDistinct, eq, gte, isNull, sql, sum } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiMessage, userTeam } from "@/database/schema";
import type { TeamApiUsage, TeamResult } from "@/lib/entities/team.type";
import { activeMembershipWhere } from "./active_membership.usecase";

const EMPTY_BUCKET = {
  promptCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: "0.00",
};

const EMPTY_USAGE: TeamApiUsage = {
  conversationCount: 0,
  promptCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCost: "0.00",
  byKeySource: {
    personal: { ...EMPTY_BUCKET },
    team: { ...EMPTY_BUCKET },
    system: { ...EMPTY_BUCKET },
    unknown: { ...EMPTY_BUCKET },
  },
};

function bucketKey(source: string | null): keyof TeamApiUsage["byKeySource"] {
  if (source === "personal" || source === "team" || source === "system") return source;
  return "unknown";
}

/** Usage only counts messages created on/after each member's team joinedAt. */
export async function getTeamApiUsage(teamId: string): Promise<TeamResult<TeamApiUsage>> {
  const id = teamId.trim();
  if (!id) {
    return { ok: false, error: "Team id is required." };
  }

  try {
    const members = await database
      .select({ userId: userTeam.userId })
      .from(userTeam)
      .where(activeMembershipWhere(eq(userTeam.teamId, id)));

    if (members.length === 0) {
      return { ok: true, data: EMPTY_USAGE };
    }

    const membershipJoin = and(
      eq(userTeam.userId, aiConversation.userId),
      eq(userTeam.teamId, id),
      eq(userTeam.archived, false),
      isNull(userTeam.leftAt),
    );

    const afterJoin = gte(aiMessage.createdAt, userTeam.joinedAt);

    const [conversationRow] = await database
      .select({ conversationCount: countDistinct(aiConversation.id) })
      .from(aiMessage)
      .innerJoin(aiConversation, eq(aiMessage.conversationId, aiConversation.id))
      .innerJoin(userTeam, membershipJoin)
      .where(afterJoin);

    const [totals] = await database
      .select({
        promptCount: count(aiMessage.id),
        inputTokens: sum(aiMessage.inputTokens),
        outputTokens: sum(aiMessage.outputTokens),
        totalCost: sql<string>`coalesce(sum(${aiMessage.cost}), 0)`,
      })
      .from(aiMessage)
      .innerJoin(aiConversation, eq(aiMessage.conversationId, aiConversation.id))
      .innerJoin(userTeam, membershipJoin)
      .where(afterJoin);

    const sourceRows = await database
      .select({
        keySource: aiMessage.keySource,
        promptCount: count(aiMessage.id),
        inputTokens: sum(aiMessage.inputTokens),
        outputTokens: sum(aiMessage.outputTokens),
        totalCost: sql<string>`coalesce(sum(${aiMessage.cost}), 0)`,
      })
      .from(aiMessage)
      .innerJoin(aiConversation, eq(aiMessage.conversationId, aiConversation.id))
      .innerJoin(userTeam, membershipJoin)
      .where(afterJoin)
      .groupBy(aiMessage.keySource);

    const byKeySource: TeamApiUsage["byKeySource"] = {
      personal: { ...EMPTY_BUCKET },
      team: { ...EMPTY_BUCKET },
      system: { ...EMPTY_BUCKET },
      unknown: { ...EMPTY_BUCKET },
    };

    for (const row of sourceRows) {
      const key = bucketKey(row.keySource);
      const inputTokens = Number(row.inputTokens ?? 0);
      const outputTokens = Number(row.outputTokens ?? 0);
      byKeySource[key] = {
        promptCount: Number(row.promptCount ?? 0),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        totalCost: Number(row.totalCost ?? 0).toFixed(2),
      };
    }

    const inputTokens = Number(totals?.inputTokens ?? 0);
    const outputTokens = Number(totals?.outputTokens ?? 0);

    return {
      ok: true,
      data: {
        conversationCount: Number(conversationRow?.conversationCount ?? 0),
        promptCount: Number(totals?.promptCount ?? 0),
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        totalCost: Number(totals?.totalCost ?? 0).toFixed(2),
        byKeySource,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load team API usage.",
    };
  }
}
