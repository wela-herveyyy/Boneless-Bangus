import { and, eq, isNull, type SQL } from "drizzle-orm";
import { userTeam } from "@/database/schema";

/** Active roster row: not archived and not soft-left. */
export function activeMembershipWhere(extra?: SQL): SQL {
  const base = and(eq(userTeam.archived, false), isNull(userTeam.leftAt));
  return extra ? and(base, extra)! : base!;
}
