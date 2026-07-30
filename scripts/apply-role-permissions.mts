/**
 * Apply role.permissions column + seed defaults (when drizzle-kit migrate is stuck).
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { ROLE_PERMISSION_DEFAULTS } from "../lib/entities/users.type";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const [cols] = await conn.query<mysql.RowDataPacket[]>(
      "SHOW COLUMNS FROM `role` LIKE 'permissions'",
    );
    if (!cols.length) {
      await conn.query("ALTER TABLE `role` ADD `permissions` json NULL");
      console.log("added role.permissions column");
    } else {
      console.log("role.permissions already exists");
    }

    await conn.query("UPDATE `role` SET `permissions` = JSON_ARRAY() WHERE `permissions` IS NULL");

    for (const [value, permissions] of Object.entries(ROLE_PERMISSION_DEFAULTS)) {
      const json = JSON.stringify(permissions);
      const [result] = await conn.query<mysql.ResultSetHeader>(
        `UPDATE \`role\` SET permissions = CAST(? AS JSON), updated_at = NOW(3) WHERE value = ?`,
        [json, value],
      );
      console.log(result.affectedRows ? `seeded ${value}` : `skip ${value}`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
