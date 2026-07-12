import { useStatusOrb, type StatusOrbProps } from "./statusOrb.hooks";

export function StatusOrb({ label, variant = "neutral" }: StatusOrbProps) {
  const { className } = useStatusOrb({ variant });

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase ${className}`}
    >
      <span className="size-2 rounded-full bg-current opacity-80" aria-hidden />
      {label}
    </span>
  );
}

