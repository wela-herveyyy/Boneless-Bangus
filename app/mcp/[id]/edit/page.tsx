import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import { McpEditServerPage as McpEditServerView } from "@/components/client-pages/mcp/edit-server/McpEditServerPage";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

function McpEditFallback() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-surface-container-low" />
    </main>
  );
}

async function McpEditContent({ params }: EditPageProps) {
  const { id } = await params;
  const result = await getMcpDataAction();

  if (!result.ok) {
    redirect(`/sign-in?callbackURL=/mcp/${id}/edit&error=${encodeURIComponent(result.error)}`);
  }

  const { catalogue, categories, currentUserId, canManageAll } = result.data;
  const server = catalogue.find((s) => s.id === id);

  if (!server) {
    redirect("/mcp?error=Server+not+found");
  }

  const isOwnerOrAdmin = canManageAll || server.userId === currentUserId;
  if (!isOwnerOrAdmin) {
    redirect("/mcp?error=Unauthorized+to+edit+this+server");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-on-surface">Edit MCP Server</h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          Update server details, connection configuration, and documented tools.
        </p>
      </div>
      <McpEditServerView server={server} categories={categories} />
    </main>
  );
}

export default function McpEditPage({ params }: EditPageProps) {
  return (
    <Suspense fallback={<McpEditFallback />}>
      <McpEditContent params={params} />
    </Suspense>
  );
}
