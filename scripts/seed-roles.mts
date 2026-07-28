/**
 * Seed role rows + backfill null user.role_id → dev.
 * // ponytail: role table empty after role_id migration
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const ROLES = [
  "owner",
  "admin",
  "tech",
  "sales",
  "dev",
  "qa",
  "po",
  "pm",
  "finance",
] as const;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const ids = new Map<string, string>();
    for (const value of ROLES) {
      const [existing] = await conn.query<mysql.RowDataPacket[]>(
        "SELECT id FROM `role` WHERE value = ? LIMIT 1",
        [value],
      );
      if (existing[0]?.id) {
        ids.set(value, String(existing[0].id));
        continue;
      }
      const id = crypto.randomUUID();
      await conn.query(
        `INSERT INTO \`role\` (id, value, label, hint, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(3), NOW(3))`,
        [id, value, value.charAt(0).toUpperCase() + value.slice(1), null],
      );
      ids.set(value, id);
      console.log("seeded role", value);
    }

    const devId = ids.get("dev")!;
    const [result] = await conn.query<mysql.ResultSetHeader>(
      "UPDATE `user` SET role_id = ? WHERE role_id IS NULL",
      [devId],
    );
    console.log(`backfilled ${result.affectedRows} user(s) → dev`);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
