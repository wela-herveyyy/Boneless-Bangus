"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { loadUserAiConfigFromIdb, saveUserAiConfigToIdb } from "@/lib/utils/mcp-idb";
import type { UserAiConfig } from "@/lib/entities/mcp_server.type";

export function JsonTab({ onClose }: { onClose?: () => void }) {
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const config = await loadUserAiConfigFromIdb();
      setJsonText(JSON.stringify(config, null, 2));
      setLoading(false);
    };
    void fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(false);
      const parsed = JSON.parse(jsonText) as UserAiConfig;
      await saveUserAiConfigToIdb(parsed);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  if (loading) {
    return <div className="text-sm text-on-surface-muted">Loading config...</div>;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Raw User AI Config</h3>
        <div className="flex gap-2">
          {onClose && (
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          )}
          <Button onClick={handleSave} variant="primary">
            Save JSON
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}
      {success && <div className="text-sm text-green-500">Saved successfully!</div>}

      <textarea
        className="flex-1 w-full resize-none rounded-xl bg-surface-container-low p-4 font-mono text-sm text-on-surface shadow-inner ghost-border focus:bg-surface-container-lowest"
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setError(null);
          setSuccess(false);
        }}
        spellCheck={false}
      />
    </div>
  );
}
