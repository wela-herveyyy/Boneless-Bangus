import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "@/components/client-pages/workspace/WorkspacePage";
import { getSession } from "@/lib/domain/services/auth.service";

export const metadata: Metadata = {
  title: "BBAI | Workspace",
  description: "Boneless Bangus AI workspace — tasks, bugs, and school setup support.",
};

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in?callbackURL=/workspace");
  }

  return <WorkspacePage userName={session.user.name} userEmail={session.user.email} />;
}
