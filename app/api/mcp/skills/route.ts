import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createSkillsMcpServer } from "@/lib/domain/services/mcp_skills.service";
import { auth } from "@/lib/domain/services/auth.service";

async function handleMcpRequest(request: NextRequest) {
  const userSession = await auth();
  if (!userSession?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true, // Use JSON instead of SSE
  });

  const server = createSkillsMcpServer(userSession.user.id);
  await server.connect(transport);

  // We must pass the raw Web Request to the WebStandardStreamableHTTPServerTransport
  return await transport.handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}
