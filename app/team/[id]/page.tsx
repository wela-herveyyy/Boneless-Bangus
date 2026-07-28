import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TeamProfilePage } from "@/components/client-pages/team-profile/TeamProfilePage";
import { getTeamDetailAction } from "@/lib/domain/actions/team.actions";
import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "BBAI | Team profile",
    description: `Team dashboard for ${id}.`,
  };
}

function TeamProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-sm text-on-surface-muted">Loading team…</p>
    </div>
  );
}

async function TeamProfileContent({ params }: PageProps) {
  const { id } = await params;
  const userSession = await auth();

  if (!userSession || userSession.expired) {
    redirect(`/sign-in?callbackURL=${encodeURIComponent(`/team/${id}`)}`);
  }

  if (!hasPermission(userSession.user.role, USER_PERMISSION.TEAMS_MANAGE)) {
    redirect("/workspace?error=" + encodeURIComponent("Admin access required."));
  }

  const detailResult = await getTeamDetailAction(id);
  if (!detailResult.ok) {
    redirect(`/admin?error=${encodeURIComponent(detailResult.error)}`);
  }

  return (
    <TeamProfilePage
      initialDetail={detailResult.data}
      currentUserName={userSession.user.name?.trim() || userSession.user.email || "Admin"}
      currentUserRole={userSession.user.role}
    />
  );
}

export default function TeamProfileRoutePage({ params }: PageProps) {
  return (
    <Suspense fallback={<TeamProfileFallback />}>
      <TeamProfileContent params={params} />
    </Suspense>
  );
}
