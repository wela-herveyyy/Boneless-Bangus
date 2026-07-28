import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/client-pages/profile/ProfilePage";
import { auth } from "@/lib/domain/services/auth.service";
import { getProfileService } from "@/lib/domain/services/profile.service";
import type { UserRole } from "@/lib/entities/users.type";

export const metadata: Metadata = {
  title: "BBAI | Profile",
  description: "Manage your profile, team, and API keys.",
};

function ProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-sm text-on-surface-muted">Loading profile…</p>
    </div>
  );
}

async function ProfileContent() {
  const userSession = await auth();

  if (!userSession || userSession.expired) {
    redirect("/sign-in?callbackURL=/profile");
  }

  const profileData = await getProfileService(userSession.user.id);

  return (
    <ProfilePage
      userId={userSession.user.id}
      userName={userSession.user.name}
      userEmail={userSession.user.email}
      userRole={(profileData.role || userSession.user.role) as UserRole}
      userSettings={profileData.settings}
      userTeam={profileData.team}
    />
  );
}

export default function ProfileRoutePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileContent />
    </Suspense>
  );
}
