import { redirect } from "next/navigation";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import { McpCataloguePageClient } from "./McpCataloguePageClient";

export default async function McpCataloguePage() {
  const result = await getMcpDataAction();

  if (!result.ok) {
    redirect(`/sign-in?callbackURL=/mcp&error=${encodeURIComponent(result.error)}`);
  }

  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-on-surface">MCP Catalogue</h1>
          <p className="mt-1 text-sm text-on-surface-muted">
            Explore, install, and manage Model Context Protocol servers & tools for AI assistants.
          </p>
        </div>
      </div>
      <McpCataloguePageClient
        initialData={result.data}
      />
    </main>
  );
}
