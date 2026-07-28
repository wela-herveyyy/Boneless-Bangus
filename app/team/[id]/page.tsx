import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TeamProfilePage } from "@/components/client-pages/team-profile/TeamProfilePage";
import { getTeamDetailAction } from "@/lib/domain/actions/team.actions";
import { getUsersAction } from "@/lib/domain/actions/users.actions";
import { auth } from "@/lib/domain/services/auth.service";
import { getManagedTeamId } from "@/lib/domain/services/team.service";
import { canManageTeams } from "@/lib/entities/team.type";
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

  const isAdmin = hasPermission(userSession.user.role, USER_PERMISSION.TEAMS_MANAGE);
  if (!isAdmin) {
    const managed = await getManagedTeamId(userSession.user.id);
    if (!managed.ok || managed.data !== id) {
      redirect("/workspace?error=" + encodeURIComponent("Team access required."));
    }
  }

  const detailResult = await getTeamDetailAction(id);
  if (!detailResult.ok) {
    redirect(
      isAdmin
        ? `/admin?error=${encodeURIComponent(detailResult.error)}`
        : `/workspace?error=${encodeURIComponent(detailResult.error)}`,
    );
  }

  const usersResult = isAdmin ? await getUsersAction() : null;
  const candidateUsers = usersResult?.ok ? usersResult.data : [];

  return (
    <TeamProfilePage
      initialDetail={detailResult.data}
      candidateUsers={candidateUsers}
      currentUserName={userSession.user.name?.trim() || userSession.user.email || "User"}
      currentUserRole={userSession.user.role}
      currentUserId={userSession.user.id}
      canChangeLeader={canManageTeams(userSession.user.role)}
      canManageRoster={true}
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
