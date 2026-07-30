import { redirect } from "next/navigation";
import { getSession } from "@/lib/domain/services/auth.service";
import { AuthShell } from "@/components/organisms/AuthShell/AuthShell";
import { normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
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
  }>;
};

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

  if (session && !hasEmbedSid) {
    redirect("/workspace");
  }

  return (
    <AuthShell
      title={hasEmbedSid ? "Connecting to BBAI" : copy.title}
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
