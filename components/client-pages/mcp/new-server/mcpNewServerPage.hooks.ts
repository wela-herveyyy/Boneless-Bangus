import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createMcpServerAction } from "@/lib/domain/actions/mcp_server.actions";
import { EMPTY_MCP_FORM, type McpFormState } from "@/lib/entities/mcp_server.type";

export type McpNewServerPageProps = {
  categories: { id: string; slug: string; name: string }[];
};

export function useMcpNewServerPage({ categories }: McpNewServerPageProps) {
  const router = useRouter();
  const [form, setForm] = useState<McpFormState>({
    ...EMPTY_MCP_FORM,
    categoryId: categories[0]?.id || "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const setFormField = useCallback((field: keyof McpFormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value as never }));
  }, []);

  const handleSave = useCallback(async () => {
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

    const targetCatId = categoryId || categories.find((c) => c.slug === category)?.id || categories[0]?.id || "";

    const res = await createMcpServerAction({
      slug: slug.trim(),
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
  }, [form, categories, router]);

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
