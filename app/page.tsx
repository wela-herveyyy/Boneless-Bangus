import { redirect } from "next/navigation";
import { OnboardingPanel } from "@/components/organisms/OnboardingPanel/OnboardingPanel";
import { getSession } from "@/lib/domain/services/auth.service";
import { getProfileService } from "@/lib/domain/services/profile.service";

export default async function Home() {
  const session = await getSession();

  // Existing users with a role skip onboarding; new Livro users land here first.
  if (session?.user.id) {
    const profile = await getProfileService(session.user.id);
    if (profile.role) {
      redirect("/workspace");
    }
  }

  return <OnboardingPanel defaultName={session?.user.name} userId={session?.user.id} />;
}
