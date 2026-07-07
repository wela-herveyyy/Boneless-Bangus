"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installOutcome, setInstallOutcome] = useState<"accepted" | "dismissed" | null>(null);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstallOutcome(outcome);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    isStandalone,
    canInstall: Boolean(deferredPrompt),
    installOutcome,
    installApp,
  };
}
