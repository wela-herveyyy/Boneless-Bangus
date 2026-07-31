import { redirect } from "next/navigation";
import { OnboardingPanel } from "@/components/organisms/OnboardingPanel/OnboardingPanel";
import { getSession } from "@/lib/domain/services/auth.service";
import { getProfileService } from "@/lib/domain/services/profile.service";
import { normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { isLivroParent } from "@/lib/utils/erp-embed";

type OnboardingPageProps = {
  searchParams: Promise<{
    embed?: string;
    parent?: string;
    school_mcp?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const session = await getSession();

  if (!session?.user.id) {
    redirect("/sign-in?callbackURL=/onboarding");
  }

  const qs = new URLSearchParams();
  const parent = normalizeErpBaseUrl(params.parent || "");
  if (parent) {
    qs.set("parent", parent);
    qs.set("embed", params.embed || "1");
    if (params.school_mcp || !isLivroParent(parent)) {
      qs.set("school_mcp", params.school_mcp || "auto");
    }
  } else if (params.embed) {
    qs.set("embed", params.embed);
  }
  const embedQs = qs.toString() ? `?${qs.toString()}` : "";

  const profile = await getProfileService(session.user.id);
  if (profile.role) {
    redirect(`/workspace${embedQs}`);
  }

  return <OnboardingPanel defaultName={session.user.name} userId={session.user.id} />;
}
