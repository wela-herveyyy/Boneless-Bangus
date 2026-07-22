import { database } from "@/database";
import { skill } from "@/database/schema";

async function run() {
  const allSkills = await database.select().from(skill);
  console.log("Total skills in DB:", allSkills.length);
  for (const s of allSkills) {
    console.log(`- ${s.name}: ${s.description}`);
  }
}

run().catch(console.error).then(() => process.exit(0));
