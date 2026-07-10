"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";
import { createMcpServerAction } from "@/lib/domain/actions/mcp_server.actions";
import { EMPTY_MCP_FORM, type McpFormState } from "@/lib/entities/mcp_server.type";

export type McpNewServerClientProps = {
  categories: { id: string; slug: string; name: string }[];
};

export function McpNewServerClient({ categories }: McpNewServerClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<McpFormState>({
    ...EMPTY_MCP_FORM,
    categoryId: categories[0]?.id || "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const setFormField = (field: keyof McpFormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value as never }));
  };

  const handleSave = async () => {
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
  };

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-bloom border border-outline/10">
      <McpServerForm
        mode="create"
        form={form}
        setFormField={setFormField}
        saveState={saveState}
        onSave={handleSave}
        onCancel={() => router.push("/mcp")}
        categories={categories}
      />
    </div>
  );
}
