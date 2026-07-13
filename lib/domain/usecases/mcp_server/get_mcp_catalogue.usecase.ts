import { cacheLife, cacheTag } from "next/cache";
import { asc } from "drizzle-orm";
import { database } from "@/database";
import { mcpServer } from "@/database/schema";
import type { McpServerDetailed } from "@/lib/entities/mcp_server.type";

export async function getMcpCatalogueUseCase(): Promise<McpServerDetailed[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("mcp_catalogue");

  try {
    const servers = await database.query.mcpServer.findMany({
      with: {
        category: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tools: {
          orderBy: (tools, { asc }) => [asc(tools.displayOrder), asc(tools.name)],
        },
      },
      orderBy: [asc(mcpServer.name)],
    });

    return servers as McpServerDetailed[];
  } catch (error) {
    console.error("Failed to fetch MCP catalogue:", error);
    return [];
  }
}

export async function fetchMcpServerByIdFromDb(id: string): Promise<McpServerDetailed | undefined> {
  try {
    const server = await database.query.mcpServer.findFirst({
      where: (mcpServer, { eq }) => eq(mcpServer.id, id),
      with: {
        category: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tools: {
          orderBy: (tools, { asc }) => [asc(tools.displayOrder), asc(tools.name)],
        },
      },
    });
    return server as McpServerDetailed | undefined;
  } catch (error) {
    console.error("Failed to fetch MCP server by ID:", error);
    return undefined;
  }
}
