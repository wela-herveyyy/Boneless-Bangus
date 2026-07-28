/**
 * Upsert built-in marketplace skills (global) and install for the author.
 *
 *   bun scripts/seed-builtin-skills.mts
 *   bun scripts/seed-builtin-skills.mts --author you@livro.systems
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import { role as roleTable, skill, skillCategory, user, userInstalledSkill } from "../database/schema";
import { BUILTIN_SKILLS } from "../lib/domain/usecases/skills/builtin_skills";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 5,
  });
  const database = drizzle(pool);

  const authorEmail = argValue("--author");
  const authors = authorEmail
    ? await database.select().from(user).where(eq(user.email, authorEmail)).limit(1)
    : await database
        .select({ user: user })
        .from(user)
        .leftJoin(roleTable, eq(user.roleId, roleTable.id))
        .where(eq(roleTable.value, "owner"))
        .limit(1)
        .then((rows) => rows.map((r) => r.user));

  let author = authors[0];
  if (!author) {
    const fallback = await database.select().from(user).limit(1);
    author = fallback[0];
  }
  if (!author) {
    throw new Error("No users in DB — create an account first (bun create-account.mts).");
  }

  console.log(`Seeding built-in skills as author ${author.email} (${author.id})…`);

  for (const def of BUILTIN_SKILLS) {
    let [category] = await database
      .select()
      .from(skillCategory)
      .where(eq(skillCategory.name, def.categoryName))
      .limit(1);

    if (!category) {
      const id = randomUUID();
      await database.insert(skillCategory).values({ id, name: def.categoryName });
      [category] = await database
        .select()
        .from(skillCategory)
        .where(eq(skillCategory.id, id))
        .limit(1);
      console.log(`+ Category '${def.categoryName}'`);
    }

    const [existing] = await database
      .select()
      .from(skill)
      .where(eq(skill.name, def.name))
      .limit(1);

    let skillId = existing?.id;
    if (existing) {
      await database
        .update(skill)
        .set({
          description: def.description,
          instructions: def.instructions,
          categoryId: category.id,
          isGlobal: true,
          updatedAt: new Date(),
        })
        .where(eq(skill.id, existing.id));
      console.log(`✓ Updated skill '${def.name}'`);
    } else {
      skillId = randomUUID();
      await database.insert(skill).values({
        id: skillId,
        name: def.name,
        description: def.description,
        instructions: def.instructions,
        categoryId: category.id,
        authorId: author.id,
        isGlobal: true,
      });
      console.log(`+ Created skill '${def.name}'`);
    }

    if (!skillId) continue;

    const [installed] = await database
      .select()
      .from(userInstalledSkill)
      .where(
        and(
          eq(userInstalledSkill.userId, author.id),
          eq(userInstalledSkill.skillId, skillId),
        ),
      )
      .limit(1);

    if (!installed) {
      await database.insert(userInstalledSkill).values({
        id: randomUUID(),
        userId: author.id,
        skillId,
      });
      console.log(`  installed for ${author.email}`);
    }
  }

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
