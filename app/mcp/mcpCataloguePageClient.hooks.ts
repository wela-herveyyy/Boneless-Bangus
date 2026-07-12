import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteMcpServerAction } from "@/lib/domain/actions/mcp_server.actions";
import { USER_AI_CONFIG_DEFAULT, type McpDataPayload, type McpServer, type UserAiConfig } from "@/lib/entities/mcp_server.type";
import { loadUserAiConfigFromIdb, saveUserAiConfigToIdb } from "@/lib/utils/mcp-idb";

export type McpCataloguePageClientProps = {
  initialData: McpDataPayload;
};

export function useMcpCataloguePageClient({ initialData }: McpCataloguePageClientProps) {
  const [rawServers, setRawServers] = useState(initialData.catalogue);
  const [categories] = useState(initialData.categories);
  const [currentUserId] = useState(initialData.currentUserId);
  const [canManageAll] = useState(initialData.canManageAll);
  const [userConfig, setUserConfig] = useState<UserAiConfig>(USER_AI_CONFIG_DEFAULT);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedServerForTools, setSelectedServerForTools] = useState<McpServer | null>(null);

  useEffect(() => {
    loadUserAiConfigFromIdb().then(setUserConfig).catch(console.error);
  }, []);

  const servers: McpServer[] = useMemo(() => {
    return rawServers.map((s) => {
      const isEnabled = Boolean(userConfig.mcpServers && userConfig.mcpServers[s.slug]);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        author: s.user?.name || "Custom",
        category: s.category?.slug || "dev-tools",
        categoryId: s.categoryId,
        configTemplate:
          typeof s.configTemplate === "string"
            ? s.configTemplate
            : JSON.stringify(s.configTemplate, null, 2),
        configTemplateObj: s.configTemplate,
        enabled: isEnabled,
        tools: s.tools || [],
      };
    });
  }, [rawServers, userConfig]);

  const filteredServers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesCat = activeCategory === "all" || server.category === activeCategory;
      const matchesQ =
        !q ||
        server.name.toLowerCase().includes(q) ||
        server.description.toLowerCase().includes(q) ||
        server.author.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [servers, query, activeCategory]);

  const toggleServer = useCallback(
    async (id: string) => {
      const target = servers.find((s) => s.id === id);
      if (!target) return;

      const nextMcpServers = { ...(userConfig.mcpServers || {}) };
      if (target.enabled) {
        delete nextMcpServers[target.slug];
      } else {
        nextMcpServers[target.slug] = target.configTemplateObj || { url: "" };
      }

      const nextConfig = { ...userConfig, mcpServers: nextMcpServers };
      setUserConfig(nextConfig);
      await saveUserAiConfigToIdb(nextConfig);
    },
    [servers, userConfig]
  );

  const confirmDelete = useCallback(async (id: string) => {
    const res = await deleteMcpServerAction({ id });
    if (res.ok) {
      setRawServers((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  }, []);

  return {
    servers,
    categories,
    currentUserId,
    canManageAll,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    deletingId,
    setDeletingId,
    selectedServerForTools,
    setSelectedServerForTools,
    filteredServers,
    toggleServer,
    confirmDelete,
  };
}
