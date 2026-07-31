/**
 * Staging / production DB seed (idempotent).
 *
 * Run AFTER migrations (`bun run db:migrate` or app `build` migrate step).
 *
 *   bun scripts/seed-deploy.mts
 *   bun scripts/seed-deploy.mts --author you@livro.systems
 *   bun scripts/seed-deploy.mts --skip-skills
 *   bun scripts/seed-deploy.mts --skip-mcp
 *
 * Seeds:
 *   1. Roles (+ backfill null role_id → dev)
 *   2. Role permissions JSON
 *   3. MCP catalogue categories (optional UI taxonomy)
 *   4. Built-in skills (GWS, ERPNext, School ERP grading reports, etc.)
 *
 * Does NOT create users — use `bun create-account.mts` once (or ERP embed login).
 * Does NOT seed ERP school data — that lives on School ERP / Livro sites.
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function run(scriptRel: string, extraArgs: string[] = []): Promise<void> {
  const script = path.join(root, scriptRel);
  const args = [script, ...extraArgs];
  console.log(`\n── bun ${scriptRel}${extraArgs.length ? ` ${extraArgs.join(" ")}` : ""} ──`);
  return new Promise((resolve, reject) => {
    const child = spawn("bun", args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRel} exited ${code}`));
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — set it for the target staging/prod DB.");
  }

  const author = argValue("--author");
  const skipSkills = hasFlag("--skip-skills");
  const skipMcp = hasFlag("--skip-mcp");

  console.log("BBAI seed-deploy");
  console.log(`  DATABASE_URL host: ${safeDbHost(process.env.DATABASE_URL)}`);
  if (author) console.log(`  skills author: ${author}`);

  await run("scripts/seed-roles.mts");
  await run("scripts/apply-role-permissions.mts");

  if (!skipMcp) {
    await run("scripts/seed-mcp-catalogue.mts");
  } else {
    console.log("\n── skip MCP catalogue (--skip-mcp) ──");
  }

  if (!skipSkills) {
    const skillArgs = author ? ["--author", author] : [];
    try {
      await run("scripts/seed-builtin-skills.mts", skillArgs);
    } catch (err) {
      console.error(
        "\n⚠ Skills seed failed (often: no users yet). Create an owner/admin first, then re-run:\n" +
          "  bun create-account.mts --email you@livro.systems --name Owner --password '…' --role owner\n" +
          "  bun run seed:skills -- --author you@livro.systems\n",
      );
      throw err;
    }
  } else {
    console.log("\n── skip built-in skills (--skip-skills) ──");
  }

  console.log("\n✅ seed-deploy finished.");
}

function safeDbHost(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(unparsed)";
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
