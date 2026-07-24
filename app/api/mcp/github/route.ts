import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createGithubMcpServer } from "@/lib/domain/services/mcp_github.service";
import { authFromHeaders } from "@/lib/domain/services/auth.service";

async function handleMcpRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header. Provide GitHub PAT as Bearer token." }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true, // Use JSON instead of SSE
  });

  const server = createGithubMcpServer(token);
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
