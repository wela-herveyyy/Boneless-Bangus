import type { SDKCustomTool, SDKJsonValue } from "@cursor/sdk";
import { createSkillUsecase } from "../skills/create_skill.usecase";
import { getSkillsUsecase } from "../skills/get_skills.usecase";

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
 * Cursor custom tools that persist skills to the DATABASE (same as skills MCP).
 * // ponytail: no presets in source — agent passes name/description/instructions
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
      "List skills stored in the BBAI database for this user.",
      { type: "object", properties: {} },
      async () => {
        try {
          const skills = await getSkillsUsecase(userId);
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
  };
}
