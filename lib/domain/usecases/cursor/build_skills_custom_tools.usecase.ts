import type { SDKCustomTool, SDKJsonValue } from "@cursor/sdk";
import { createSkillUsecase } from "../skills/create_skill.usecase";
import {
  getSkillByNameUsecase,
  listSkillCatalogUsecase,
} from "../skills/get_skill.usecase";

function jsonResult(data: unknown): SDKJsonValue {
  return JSON.parse(JSON.stringify(data ?? null)) as SDKJsonValue;
}

function tool(
  description: string,
  inputSchema: Record<string, SDKJsonValue> | undefined,
  execute: SDKCustomTool["execute"],
): SDKCustomTool {
  return { description, inputSchema, execute };
}

function str(value: SDKJsonValue | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Cursor custom tools that persist/load skills from the DATABASE (same as skills MCP).
 * Full templates live in DB records — use skills_get_skill, never repo files.
 */
export async function buildSkillsCustomTools(
  userId: string,
): Promise<Record<string, SDKCustomTool>> {
  return {
    skills_create_skill: tool(
      "Create a reusable skill and save it to the BBAI database (not source code). Use after collecting name, description, and instructions via /skill-maker.",
      {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          instructions: { type: "string" },
          categoryName: { type: "string" },
          isGlobal: { type: "boolean" },
        },
        required: ["name", "description", "instructions"],
      },
      async (args) => {
        try {
          await createSkillUsecase({
            name: str(args.name),
            description: str(args.description),
            instructions: str(args.instructions),
            categoryName: str(args.categoryName, "Agent Skills"),
            isGlobal: args.isGlobal === true,
            authorId: userId,
          });
          return jsonResult({
            ok: true,
            message: `Skill saved to database: ${str(args.name)}`,
          });
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: error instanceof Error ? error.message : "Failed to create skill.",
              },
            ],
            isError: true,
          };
        }
      },
    ),
    skills_list_skills: tool(
      "List skill catalog (name/description only). Use skills_get_skill for full instructions/templates.",
      { type: "object", properties: {} },
      async () => {
        try {
          const skills = await listSkillCatalogUsecase(userId);
          return jsonResult(skills);
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: error instanceof Error ? error.message : "Failed to list skills.",
              },
            ],
            isError: true,
          };
        }
      },
    ),
    skills_get_skill: tool(
      "Load one skill by exact name including full instructions (e.g. BED Report Card SF9 Template HTML/CSS). Prefer this over reading the codebase.",
      {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
      async (args) => {
        try {
          const record = await getSkillByNameUsecase(userId, str(args.name));
          if (!record) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Skill not found or not accessible: ${str(args.name)}`,
                },
              ],
              isError: true,
            };
          }
          return jsonResult(record);
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: error instanceof Error ? error.message : "Failed to get skill.",
              },
            ],
            isError: true,
          };
        }
      },
    ),
  };
}
