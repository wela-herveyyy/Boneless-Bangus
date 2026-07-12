"use client";

import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";
import {
  useMcpEditServerPage,
  type McpEditServerPageProps,
} from "./mcpEditServerPage.hooks";

export function McpEditServerPage({ server, categories }: McpEditServerPageProps) {
  const {
    form,
    saveState,
    setFormField,
    handleSave,
    handleCancel,
  } = useMcpEditServerPage({ server, categories });

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
