import { OnboardingPanel } from "@/components/organisms/OnboardingPanel/OnboardingPanel";
import { getSession } from "@/lib/domain/services/auth.service";

export default async function Home() {
  const session = await getSession();

  return <OnboardingPanel defaultName={session?.user.name} />;
}
