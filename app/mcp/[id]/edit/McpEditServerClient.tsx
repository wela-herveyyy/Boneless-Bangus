"use client";

import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";
import {
  useMcpEditServerClient,
  type McpEditServerClientProps,
} from "./mcpEditServerClient.hooks";

export function McpEditServerClient({ server, categories }: McpEditServerClientProps) {
  const {
    form,
    saveState,
    setFormField,
    handleSave,
    handleCancel,
  } = useMcpEditServerClient({ server, categories });

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-bloom border border-outline/10">
      <McpServerForm
        mode="edit"
        form={form}
        setFormField={setFormField}
        saveState={saveState}
        onSave={handleSave}
        onCancel={handleCancel}
        categories={categories}
      />
    </div>
  );
}
