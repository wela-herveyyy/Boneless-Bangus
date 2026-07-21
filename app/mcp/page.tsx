import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import { McpCataloguePage as McpCatalogueView } from "@/components/client-pages/mcp/catalogue/McpCataloguePage";

function McpCatalogueFallback() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
        <div className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
    </main>
  );
}

async function McpCatalogueContent() {
  const result = await getMcpDataAction();

  if (!result.ok) {
    redirect(`/sign-in?callbackURL=/mcp&error=${encodeURIComponent(result.error)}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">MCP Catalogue</h1>
          <p className="mt-1 text-sm text-on-surface-muted">
            Explore, install, and manage Model Context Protocol servers & tools for AI assistants.
          </p>
        </div>
      </div>
      <McpCatalogueView initialData={result.data} />
    </main>
  );
}

export default function McpCataloguePage() {
  return (
    <Suspense fallback={<McpCatalogueFallback />}>
      <McpCatalogueContent />
    </Suspense>
  );
}
