import { redirect } from "next/navigation";
import { OnboardingPanel } from "@/components/organisms/OnboardingPanel/OnboardingPanel";
import { getSession } from "@/lib/domain/services/auth.service";
import { getProfileService } from "@/lib/domain/services/profile.service";
import { USER_ROLE } from "@/lib/entities/users.type";

const SKIP_ONBOARDING_ROLES = new Set<string>([USER_ROLE.OWNER, USER_ROLE.ADMIN]);

export default async function Home() {
  const session = await getSession();

  // Owner/admin are assigned in admin — skip role/focus onboarding
  if (session?.user.id) {
    const profile = await getProfileService(session.user.id);
    const role = profile.role?.toLowerCase();
    if (role && SKIP_ONBOARDING_ROLES.has(role)) {
      redirect("/workspace");
    }
  }

  return <OnboardingPanel defaultName={session?.user.name} userId={session?.user.id} />;
}
