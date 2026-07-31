import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createSkillUsecase } from "../usecases/skills/create_skill.usecase";
import {
  getSkillByNameUsecase,
  listSkillCatalogUsecase,
} from "../usecases/skills/get_skill.usecase";

export function createSkillsMcpServer(userId: string) {
  const server = new Server(
    {
      name: "skills-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "create_skill",
          description:
            "Create and persist a new reusable skill in the Giya skills database (not source code). Requires name, description, and detailed instructions.",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "A concise name for the skill (e.g., 'React Code Reviewer').",
              },
              description: {
                type: "string",
                description: "A short summary of what this skill does.",
              },
              instructions: {
                type: "string",
                description:
                  "The detailed markdown or textual instructions defining the workflow/behavior.",
              },
              categoryName: {
                type: "string",
                description: "The category to group this skill under (defaults to 'Agent Skills').",
              },
              isGlobal: {
                type: "boolean",
                description:
                  "Set to true to publish this skill to the global marketplace. Set to false to keep it private.",
              },
            },
            required: ["name", "description", "instructions"],
          },
        },
        {
          name: "list_skills",
          description:
            "List skill catalog records (id, name, description, category). Does not include full instructions — use get_skill for the body.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_skill",
          description:
            "Load one skill record by exact name, including full instructions (templates, HTML/CSS, workflows). Use this instead of reading the codebase.",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: 'Exact skill name, e.g. "BED Report Card SF9 Template".',
              },
            },
            required: ["name"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_skill": {
          const skillName = String(args?.name || "");
          const description = String(args?.description || "");
          const instructions = String(args?.instructions || "");
          const categoryName = String(args?.categoryName || "Agent Skills");
          const isGlobal = args?.isGlobal === true;

          await createSkillUsecase({
            name: skillName,
            description,
            instructions,
            categoryName,
            isGlobal,
            authorId: userId,
          });

          return { content: [{ type: "text", text: `Successfully created skill: ${skillName}` }] };
        }

        case "list_skills": {
          const skills = await listSkillCatalogUsecase(userId);
          return { content: [{ type: "text", text: JSON.stringify(skills, null, 2) }] };
        }

        case "get_skill": {
          const skillName = String(args?.name || "");
          const record = await getSkillByNameUsecase(userId, skillName);
          if (!record) {
            return {
              content: [
                {
                  type: "text",
                  text: `Skill not found or not accessible: ${skillName}. Run bun run seed:skills if builtins are missing.`,
                },
              ],
              isError: true,
            };
          }
          return { content: [{ type: "text", text: JSON.stringify(record, null, 2) }] };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error executing tool ${name}: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  return server;
}
