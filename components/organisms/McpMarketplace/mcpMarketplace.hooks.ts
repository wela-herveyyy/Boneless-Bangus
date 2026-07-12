"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_MCP_FORM,
  MCP_CATEGORIES,
  getCategoryLabel,
  type McpCategory,
  type McpFormState,
  type McpServer,
  type McpServerDetailed,
  type McpView,
  USER_AI_CONFIG_DEFAULT,
  type UserAiConfig,
} from "@/lib/entities/mcp_server.type";
import {
  getMcpDataAction,
  createMcpServerAction,
  updateMcpServerAction,
  deleteMcpServerAction,
} from "@/lib/domain/actions/mcp_server.actions";
import {
  loadUserAiConfigFromIdb,
  saveUserAiConfigToIdb,
} from "@/lib/utils/mcp-idb";

export { MCP_CATEGORIES, getCategoryLabel } from "@/lib/entities/mcp_server.type";
export type { McpCategory, McpFormState, McpServer, McpView };

export function useMcpMarketplace() {
  const [rawServers, setRawServers] = useState<McpServerDetailed[]>([]);
  const [userConfig, setUserConfig] = useState<UserAiConfig>(USER_AI_CONFIG_DEFAULT);
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [canManageAll, setCanManageAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<McpCategory | "all">("all");

  const [view, setView] = useState<McpView>("list");
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [form, setFormRaw] = useState<McpFormState>(EMPTY_MCP_FORM);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, idbConfig] = await Promise.all([
        getMcpDataAction(),
        loadUserAiConfigFromIdb(),
      ]);
      if (res.ok) {
        setRawServers(res.data.catalogue);
        setCategories(res.data.categories);
        setCurrentUserId(res.data.currentUserId);
        setCanManageAll(res.data.canManageAll);
      }
      setUserConfig(idbConfig);
    } catch (err) {
      console.error("Failed to load MCP Marketplace data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        configTemplate: typeof s.configTemplate === "string"
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
      const matchesCategory = activeCategory === "all" || server.category === activeCategory;
      const matchesQuery =
        !q ||
        server.name.toLowerCase().includes(q) ||
        server.description.toLowerCase().includes(q) ||
        server.author.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [servers, query, activeCategory]);

  const enabledCount = useMemo(() => servers.filter((s) => s.enabled).length, [servers]);

  const setFormField = (field: keyof McpFormState, value: unknown) => {
    setFormRaw((prev) => {
      if (field === "category" && typeof value === "string") {
        const matchingCat = categories.find((c) => c.slug === value);
        return { ...prev, category: value, categoryId: matchingCat ? matchingCat.id : prev.categoryId };
      }
      return { ...prev, [field]: value as never };
    });
  };

  const toggleServer = async (idOrSlug: string) => {
    const target = servers.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
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
  };

  const startCreate = () => {
    const defaultCat = categories.find((c) => c.slug === EMPTY_MCP_FORM.category)?.id || categories[0]?.id || "";
    setFormRaw({ ...EMPTY_MCP_FORM, categoryId: defaultCat });
    setSaveState("idle");
    setDeletingServerId(null);
    setView("create");
  };

  const startEdit = (server: McpServer) => {
    setFormRaw({
      id: server.id,
      slug: server.slug,
      name: server.name,
      description: server.description,
      author: server.author,
      category: server.category,
      categoryId: server.categoryId || categories.find((c) => c.slug === server.category)?.id || "",
      configTemplate: server.configTemplate,
      tools: (server.tools || []).map((t: any) => ({
        name: t.name || t.toolName || "",
        description: t.description || "",
        inputSchema: t.inputSchema ?? null,
      })),
    });
    setEditingServer(server);
    setSaveState("idle");
    setDeletingServerId(null);
    setView("edit");
  };

  const cancelForm = () => {
    setEditingServer(null);
    setFormRaw(EMPTY_MCP_FORM);
    setSaveState("idle");
    setView("list");
  };

  const saveServer = async () => {
    const { slug, name, description, category, categoryId, configTemplate, tools } = form;

    if (!slug.trim() || !name.trim() || !description.trim()) {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(configTemplate);
    } catch {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    const targetCategoryId = categories.find((c) => c.slug === category)?.id || categoryId || categories[0]?.id || "";

    if (view === "create") {
      const res = await createMcpServerAction({
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim(),
        categoryId: targetCategoryId,
        configTemplate: parsedConfig,
        tools: tools || [],
      });
      if (!res.ok) {
        console.error("Failed to create MCP server:", res.error);
        setSaveState("error");
        window.setTimeout(() => setSaveState("idle"), 2000);
        return;
      }
    } else if (view === "edit" && editingServer) {
      const res = await updateMcpServerAction({
        id: editingServer.id,
        name: name.trim(),
        description: description.trim(),
        categoryId: targetCategoryId,
        configTemplate: parsedConfig,
        tools: tools || [],
      });
      if (!res.ok) {
        console.error("Failed to update MCP server:", res.error);
        setSaveState("error");
        window.setTimeout(() => setSaveState("idle"), 2000);
        return;
      }
    }

    await loadData();
    setSaveState("saved");
    window.setTimeout(() => {
      setSaveState("idle");
      cancelForm();
    }, 800);
  };

  const requestDelete = (id: string) => setDeletingServerId(id);
  const cancelDelete = () => setDeletingServerId(null);
  const confirmDelete = async (id: string) => {
    await deleteMcpServerAction({ id });
    setDeletingServerId(null);
    await loadData();
  };

  return {
    servers,
    filteredServers,
    categories,
    currentUserId,
    canManageAll,
    loading,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    enabledCount,
    toggleServer,
    view,
    form,
    setFormField,
    editingServer,
    saveState,
    deletingServerId,
    startCreate,
    startEdit,
    cancelForm,
    saveServer,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
