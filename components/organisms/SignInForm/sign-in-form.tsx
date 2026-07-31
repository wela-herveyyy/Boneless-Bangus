import { redirect } from "next/navigation";
import { auth, getSession } from "@/lib/domain/services/auth.service";
import { AuthShell } from "@/components/organisms/AuthShell/AuthShell";
import { normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { isLivroParent } from "@/lib/utils/erp-embed";
import { getSignInCopy, resolveSignInErpBase } from "@/lib/utils/erp-sign-in-copy";
import { ErpEmbedSignIn } from "./erp-embed-sign-in";

type SignInFormProps = {
  searchParams: Promise<{
    error?: string;
    callbackURL?: string;
    sid?: string;
    erp_sid?: string;
    parent?: string;
    erp?: string;
    erp_url?: string;
    embed?: string;
    school_mcp?: string;
  }>;
};

/** Keep FAB embed context across post-auth redirects. */
function embedQueryFromSignIn(params: {
  parent?: string | null;
  embed?: string;
  school_mcp?: string;
  callbackURL?: string;
}): string {
  const qs = new URLSearchParams();
  let parent = params.parent || null;
  let embed = params.embed || null;
  let schoolMcp = params.school_mcp || null;

  if (params.callbackURL?.startsWith("/")) {
    try {
      const cb = new URL(params.callbackURL, "http://bbai.local");
      parent = parent || cb.searchParams.get("parent");
      embed = embed || cb.searchParams.get("embed");
      schoolMcp = schoolMcp || cb.searchParams.get("school_mcp");
    } catch {
      /* ignore */
    }
  }

  const normalized = parent ? normalizeErpBaseUrl(parent) : null;
  if (normalized) {
    qs.set("parent", normalized);
    qs.set("embed", embed || "1");
    if (schoolMcp || !isLivroParent(normalized)) {
      qs.set("school_mcp", schoolMcp || "auto");
    }
  } else if (embed) {
    qs.set("embed", embed);
  }

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function SignInForm({ searchParams }: SignInFormProps) {
  const session = await getSession();
  const params = await searchParams;

  const embedSid = (params.sid || params.erp_sid || "").trim() || null;
  const embedParent = normalizeErpBaseUrl(
    params.parent || params.erp || params.erp_url || "",
  );
  const hasEmbedSid = Boolean(embedSid && embedParent);

  // Password / branding target: parent if present, else Livro
  const erpBaseUrl = resolveSignInErpBase(embedParent);
  const copy = getSignInCopy(erpBaseUrl);

  // Session without role → onboarding. Never send no-role users to /workspace
  // (auth() is null there → bounce back to /sign-in → infinite reload).
  if (session && !hasEmbedSid) {
    const access = await auth();
    const embedQs = embedQueryFromSignIn({
      parent: embedParent,
      embed: params.embed,
      school_mcp: params.school_mcp,
      callbackURL: params.callbackURL,
    });
    redirect(access ? `/workspace${embedQs}` : `/onboarding${embedQs}`);
  }

  return (
    <AuthShell
      title={hasEmbedSid ? "Connecting to Giya" : copy.title}
      description={
        hasEmbedSid
          ? "Using your ERPNext session — no password required."
          : copy.description
      }
      variant="sign-in"
    >
      <ErpEmbedSignIn
        callbackURL={params.callbackURL || "/workspace"}
        initialError={params.error}
        embedSid={embedSid}
        embedParent={embedParent}
        erpBaseUrl={erpBaseUrl}
      />
    </AuthShell>
  );
}
