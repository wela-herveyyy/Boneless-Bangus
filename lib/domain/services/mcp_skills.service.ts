import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createSkillUsecase } from "../usecases/skills/create_skill.usecase";
import { getSkillsUsecase } from "../usecases/skills/get_skills.usecase";

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
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "create_skill",
          description: "Create and persist a new reusable skill based on a workflow or user instruction. Requires name, description, and detailed instructions.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "A concise name for the skill (e.g., 'React Code Reviewer')." },
              description: { type: "string", description: "A short summary of what this skill does." },
              instructions: { type: "string", description: "The detailed markdown or textual instructions defining the workflow/behavior." },
              categoryName: { type: "string", description: "The category to group this skill under (defaults to 'Agent Skills')." }
            },
            required: ["name", "description", "instructions"],
          },
        },
        {
          name: "list_skills",
          description: "List all custom skills stored in the database.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        }
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
          
          await createSkillUsecase({
            name: skillName,
            description,
            instructions,
            categoryName,
            authorId: userId,
          });

          return { content: [{ type: "text", text: `Successfully created skill: ${skillName}` }] };
        }
        
        case "list_skills": {
          const skills = await getSkillsUsecase();
          return { content: [{ type: "text", text: JSON.stringify(skills, null, 2) }] };
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
