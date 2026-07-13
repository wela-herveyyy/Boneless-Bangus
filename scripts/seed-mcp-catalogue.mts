import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { mcpCategory } from "../database/schema.js";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 5,
});
const database = drizzle(pool);

async function seedCategories() {
  console.log("🌱 Seeding MCP categories...");

  const initialCategories = [
    {
      slug: "web-search",
      name: "Web & Search",
      description: "Browsing, scraping, and web search integrations.",
      displayOrder: 1,
    },
    {
      slug: "dev-tools",
      name: "Code & Dev",
      description: "Source control, terminal execution, and development utilities.",
      displayOrder: 2,
    },
    {
      slug: "productivity",
      name: "Productivity",
      description: "Calendar, task management, notes, and document tools.",
      displayOrder: 3,
    },
    {
      slug: "utilities",
      name: "System Utilities",
      description: "File system access, local automation, and system diagnostics.",
      displayOrder: 4,
    },
  ];

  for (const cat of initialCategories) {
    const [existing] = await database
      .select()
      .from(mcpCategory)
      .where(eq(mcpCategory.slug, cat.slug))
      .limit(1);

    if (existing) {
      console.log(`✓ Category '${cat.name}' (${cat.slug}) already exists, skipping.`);
    } else {
      await database.insert(mcpCategory).values({
        id: crypto.randomUUID(),
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`+ Created category '${cat.name}' (${cat.slug}).`);
    }
  }

  console.log("✅ MCP categories seeding finished!");
  await pool.end();
}

seedCategories().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
