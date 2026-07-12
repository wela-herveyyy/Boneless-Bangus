import { redirect } from "next/navigation";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import { McpEditServerPage as McpEditServerView } from "@/components/client-pages/mcp/edit-server/McpEditServerPage";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function McpEditPage({ params }: EditPageProps) {
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
    <main className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-on-surface">Edit MCP Server</h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          Update server details, connection configuration, and documented tools.
        </p>
      </div>
      <McpEditServerView server={server} categories={categories} />
    </main>
  );
}
