import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import { McpNewServerPage as McpNewServerView } from "@/components/client-pages/mcp/new-server/McpNewServerPage";

function McpNewFallback() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-72 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-surface-container-low" />
    </main>
  );
}

async function McpNewContent() {
  const result = await getMcpDataAction();

  if (!result.ok) {
    redirect(`/sign-in?callbackURL=/mcp/new&error=${encodeURIComponent(result.error)}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-on-surface">Register New MCP Server</h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          Add an MCP server to the global catalogue and configure exposed tools.
        </p>
      </div>
      <McpNewServerView categories={result.data.categories} />
    </main>
  );
}

export default function McpNewPage() {
  return (
    <Suspense fallback={<McpNewFallback />}>
      <McpNewContent />
    </Suspense>
  );
}
