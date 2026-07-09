export function useMcpServerFormStyles() {
  const fieldClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors input-glow focus:bg-surface-container-lowest placeholder:text-on-surface-muted";

  const containerClass = "flex flex-1 flex-col overflow-y-auto";
  const headerClass = "border-b border-primary/10 px-4 py-3";
  const bodyClass = "flex-1 space-y-4 overflow-y-auto p-4";
  const footerClass = "border-t border-primary/10 px-4 py-4";

  return {
    fieldClass,
    containerClass,
    headerClass,
    bodyClass,
    footerClass,
  };
}
