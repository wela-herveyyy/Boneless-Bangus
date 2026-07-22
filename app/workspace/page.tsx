import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "@/components/client-pages/workspace/WorkspacePage";
import { auth } from "@/lib/domain/services/auth.service";
import { getProfileService } from "@/lib/domain/services/profile.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

export const metadata: Metadata = {
  title: "BBAI | Workspace",
  description: "Boneless Bangus AI workspace — tasks, bugs, and school setup support.",
};

export default async function Page() {
  const userSession = await auth();

  if (!userSession || userSession.expired) {
    redirect("/sign-in?callbackURL=/workspace");
  }

  const profileData = await getProfileService(userSession.user.id);
  const showAdminLink = hasPermission(userSession.user.role, USER_PERMISSION.TEAMS_MANAGE);

  return (
    <WorkspacePage
      userId={userSession.user.id}
      userName={userSession.user.name}
      userEmail={userSession.user.email}
      userSettings={profileData.settings}
      userTeam={profileData.team}
      showAdminLink={showAdminLink}
      userRole={userSession.user.role}
    />
  );
}
