/**
 * Create or update a Better Auth email/password account + role.
 *
 *   bun create-account.mts
 *   bun create-account.mts --email you@livro.systems --name "Ada" --password 'secret' --role admin
 *
 * If the email already exists: updates password, role, and name (when provided).
 * // ponytail: upsert replaces a separate reset-password script for ops
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { hashPassword } from "better-auth/crypto";
import { account, user, role as roleTable } from "./database/schema";

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

type Role = (typeof ROLES)[number];

type Args = {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  image?: string;
};

function printUsage() {
  console.log(`
Create / update account

Interactive:
  bun create-account.mts

With flags:
  bun create-account.mts --email <email> --name <name> --password <password> --role <role> [--image <url>]

If email exists: password + role are updated (name/image if provided).

Roles: ${ROLES.join(", ")}
`);
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key.startsWith("--")) continue;
    if (key === "--help" || key === "-h") continue;
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${key}`);
    }
    const field = key.slice(2) as keyof Args;
    if (
      field === "email" ||
      field === "name" ||
      field === "password" ||
      field === "role" ||
      field === "image"
    ) {
      out[field] = value;
      i++;
    } else {
      throw new Error(`Unknown flag: ${key}`);
    }
  }
  return out;
}

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

async function ask(rl: ReturnType<typeof createInterface>, label: string) {
  return (await rl.question(`${label}: `)).trim();
}

async function promptMissing(
  args: Args,
): Promise<
  Required<Pick<Args, "email" | "name" | "password" | "role">> & {
    image: string | null;
  }
> {
  const rl = createInterface({ input, output });
  try {
    console.log("Create / update account\n");

    let email = args.email?.trim().toLowerCase() ?? "";
    while (!email.includes("@")) {
      email = (await ask(rl, "Email")).toLowerCase();
      if (!email.includes("@")) console.log("  Enter a valid email.");
    }

    let name = args.name?.trim() ?? "";
    while (!name) {
      name = await ask(rl, "Name");
      if (!name) console.log("  Name is required.");
    }

    let password = args.password ?? "";
    if (password && password.length < 8) {
      console.log("  --password too short; enter a new one.");
      password = "";
    }
    while (password.length < 8) {
      password = await ask(rl, "Password (min 8 chars)");
      if (password.length < 8) {
        console.log(`  Too short (${password.length}/8).`);
        password = "";
      }
    }

    let role = args.role?.trim().toLowerCase() ?? "";
    while (!isRole(role)) {
      console.log(`  Roles: ${ROLES.join(", ")}`);
      role = (await ask(rl, "Role")).toLowerCase();
      if (!isRole(role)) console.log("  Invalid role.");
    }

    let image: string | null = args.image?.trim() || null;
    if (args.image === undefined) {
      image = (await ask(rl, "Image URL (optional, Enter to skip)")) || null;
    }

    return { email, name, password, role, image };
  } finally {
    rl.close();
  }
}

async function ensureRoleId(
  database: ReturnType<typeof drizzle>,
  role: Role,
  now: Date,
): Promise<string> {
  const [existingRole] = await database
    .select({ id: roleTable.id })
    .from(roleTable)
    .where(eq(roleTable.value, role))
    .limit(1);

  if (existingRole) return existingRole.id;

  const id = crypto.randomUUID();
  await database.insert(roleTable).values({
    id,
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
    hint: `System auto-created role record for ${role}`,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const { email, name, password, role, image } = await promptMissing(
    parseArgs(argv),
  );

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Put it in .env");
  }

  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 2,
  });
  const database = drizzle(pool);

  try {
    const now = new Date();
    const hashed = await hashPassword(password);
    const targetRoleId = await ensureRoleId(database, role, now);

    const [existing] = await database
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing) {
      await database
        .update(user)
        .set({
          name,
          roleId: targetRoleId,
          ...(image ? { image } : {}),
          updatedAt: now,
        })
        .where(eq(user.id, existing.id));

      const [cred] = await database
        .select({ id: account.id })
        .from(account)
        .where(
          and(eq(account.userId, existing.id), eq(account.providerId, "credential")),
        )
        .limit(1);

      if (cred) {
        await database
          .update(account)
          .set({ password: hashed, updatedAt: now })
          .where(eq(account.id, cred.id));
      } else {
        await database.insert(account).values({
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: hashed,
          createdAt: now,
          updatedAt: now,
        });
      }

      console.log("\nAccount updated.");
      console.log(`  id:    ${existing.id}`);
      console.log(`  email: ${email}`);
      console.log(`  name:  ${name}`);
      console.log(`  role:  ${role}`);
      return;
    }

    const userId = crypto.randomUUID();
    await database.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      image,
      roleId: targetRoleId,
      createdAt: now,
      updatedAt: now,
    });

    await database.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    });

    console.log("\nAccount created.");
    console.log(`  id:    ${userId}`);
    console.log(`  email: ${email}`);
    console.log(`  name:  ${name}`);
    console.log(`  role:  ${role}`);
    if (image) console.log(`  image: ${image}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
