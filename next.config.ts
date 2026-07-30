import type { NextConfig } from "next";

function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Any ERP desk may iframe BBAI (Livro, school, localhost:8007, …).
 * Set NEXT_PUBLIC_ERP_FRAME_ANCESTORS to a comma list to lock down instead of *.
 */
function frameAncestorsHeader(): string {
  const locked = (process.env.NEXT_PUBLIC_ERP_FRAME_ANCESTORS ?? "").trim();
  if (!locked || locked === "*") {
    return "frame-ancestors *";
  }
  const origins = new Set<string>(["'self'"]);
  const livro = normalizeOrigin(process.env.NEXT_PUBLIC_ERP_BASE_URL ?? "");
  if (livro) origins.add(livro);
  for (const part of locked.split(",")) {
    const origin = normalizeOrigin(part);
    if (origin) origins.add(origin);
  }
  return `frame-ancestors ${[...origins].join(" ")}`;
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@cursor/sdk"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: frameAncestorsHeader() },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
