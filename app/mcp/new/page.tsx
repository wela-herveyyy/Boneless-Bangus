import { redirect } from "next/navigation";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import { McpNewServerClient } from "./McpNewServerClient";

export default async function McpNewPage() {
  const result = await getMcpDataAction();

  if (!result.ok) {
    redirect(`/sign-in?callbackURL=/mcp/new&error=${encodeURIComponent(result.error)}`);
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-on-surface">Register New MCP Server</h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          Add an MCP server to the global catalogue and configure exposed tools.
        </p>
      </div>
      <McpNewServerClient categories={result.data.categories} />
    </main>
  );
}
