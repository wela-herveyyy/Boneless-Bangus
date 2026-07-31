import {
  ERP_BASE_URL,
  normalizeErpBaseUrl,
} from "@/lib/entities/erpnext.type";
import { isLivroParent } from "@/lib/utils/erp-embed";

/** Resolve which ERP site the sign-in page authenticates against. */
export function resolveSignInErpBase(parentRaw?: string | null): string {
  return (
    normalizeErpBaseUrl(parentRaw || "") ||
    normalizeErpBaseUrl(ERP_BASE_URL) ||
    "https://erp.livro.systems"
  );
}

export function getSignInCopy(erpBase: string) {
  const livro = isLivroParent(erpBase);
  let host = erpBase;
  try {
    host = new URL(erpBase).host;
  } catch {
    // keep raw
  }

  if (livro) {
    return {
      title: "Sign in with Livro",
      description: "Use your Livro ERP credentials. New users are onboarded automatically.",
      emailLabel: "Livro email",
      emailPlaceholder: "you@livro.systems",
      submitLabel: "Sign in with Livro",
      footer: "No separate registration — first login creates your Giya profile, then onboarding.",
      siteLabel: "Livro",
      host,
      isLivro: true as const,
    };
  }

  return {
    title: "Sign in to ERPNext",
    description: `Use your credentials for ${host}. New users are onboarded automatically.`,
    emailLabel: "Email",
    emailPlaceholder: "you@school.edu",
    submitLabel: "Sign in",
    footer: `Signing in against ${host} — first login creates your Giya profile, then onboarding.`,
    siteLabel: host,
    host,
    isLivro: false as const,
  };
}
