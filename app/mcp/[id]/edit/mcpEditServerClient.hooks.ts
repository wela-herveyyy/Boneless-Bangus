import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { updateMcpServerAction } from "@/lib/domain/actions/mcp_server.actions";
import type { McpFormState, McpServerDetailed } from "@/lib/entities/mcp_server.type";

export type McpEditServerClientProps = {
  server: McpServerDetailed;
  categories: { id: string; slug: string; name: string }[];
};

export function useMcpEditServerClient({ server, categories }: McpEditServerClientProps) {
  const router = useRouter();

  const initialCategorySlug =
    server.category?.slug || categories.find((c) => c.id === server.categoryId)?.slug || "";

  const [form, setForm] = useState<McpFormState>({
    id: server.id,
    slug: server.slug,
    name: server.name,
    description: server.description,
    author: server.user?.name || "Custom",
    category: initialCategorySlug,
    categoryId: server.categoryId,
    configTemplate:
      typeof server.configTemplate === "string"
        ? server.configTemplate
        : JSON.stringify(server.configTemplate, null, 2),
    tools: (server.tools || []).map((t) => ({
      name: t.name || "",
      description: t.description || "",
      inputSchema:
        typeof t.inputSchema === "string"
          ? t.inputSchema
          : t.inputSchema
            ? JSON.stringify(t.inputSchema, null, 2)
            : '{\n  "type": "object",\n  "properties": {}\n}',
    })),
  });

  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const setFormField = useCallback((field: keyof McpFormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value as never }));
  }, []);

  const handleSave = useCallback(async () => {
    const { name, description, category, categoryId, configTemplate, tools } = form;

    if (!name.trim() || !description.trim()) {
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

    const targetCatId = categoryId || categories.find((c) => c.slug === category)?.id || server.categoryId;

    const res = await updateMcpServerAction({
      id: server.id,
      name: name.trim(),
      description: description.trim(),
      categoryId: targetCatId,
      configTemplate: parsedConfig,
      tools: tools || [],
    });

    if (!res.ok) {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    setSaveState("saved");
    window.setTimeout(() => {
      router.push("/mcp");
    }, 600);
  }, [form, categories, server, router]);

  const handleCancel = useCallback(() => {
    router.push("/mcp");
  }, [router]);

  return {
    form,
    saveState,
    setFormField,
    handleSave,
    handleCancel,
  };
}
