"use client";

import { useCallback, useState } from "react";
import type { ConfirmModalVariant } from "./ConfirmModal";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmModalVariant;
  tone?: "default" | "danger";
  /** Return `false` to keep the modal open (e.g. after a failed action). */
  onConfirm: () => void | boolean | Promise<void | boolean>;
};

export function useConfirmModal() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = useCallback((next: ConfirmRequest) => {
    setRequest(next);
  }, []);

  const cancel = useCallback(() => {
    if (busy) return;
    setRequest(null);
  }, [busy]);

  const confirm = useCallback(async () => {
    if (!request) return;
    setBusy(true);
    try {
      const result = await request.onConfirm();
      if (result !== false) setRequest(null);
    } finally {
      setBusy(false);
    }
  }, [request]);

  return {
    isOpen: Boolean(request),
    request,
    busy,
    ask,
    cancel,
    confirm,
  };
}
