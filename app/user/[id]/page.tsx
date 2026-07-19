import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserProfilePage } from "@/components/client-pages/user-profile/UserProfilePage";
import { getAdminUserDetailAction } from "@/lib/domain/actions/users.actions";
import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "BBAI | User profile",
    description: `Profile and prompt history for user ${id}.`,
  };
}

function UserProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-sm text-on-surface-muted">Loading profile…</p>
    </div>
  );
}

async function UserProfileContent({ params }: PageProps) {
  const { id } = await params;
  const userSession = await auth();

  if (!userSession || userSession.expired) {
    redirect(`/sign-in?callbackURL=${encodeURIComponent(`/user/${id}`)}`);
  }

  const isSelf = userSession.user.id === id;
  const viewerIsAdmin = hasPermission(userSession.user.role, USER_PERMISSION.USERS_AUDIT);

  if (!isSelf && !viewerIsAdmin) {
    redirect("/workspace?error=" + encodeURIComponent("You cannot view this profile."));
  }

  const detailResult = await getAdminUserDetailAction(id);
  if (!detailResult.ok) {
    redirect(
      viewerIsAdmin
        ? `/admin?error=${encodeURIComponent(detailResult.error)}`
        : `/workspace?error=${encodeURIComponent(detailResult.error)}`,
    );
  }

  return (
    <UserProfilePage
      userId={id}
      initialDetail={detailResult.data}
      viewerIsAdmin={viewerIsAdmin}
      isSelf={isSelf}
    />
  );
}

export default function UserProfileRoutePage({ params }: PageProps) {
  return (
    <Suspense fallback={<UserProfileFallback />}>
      <UserProfileContent params={params} />
    </Suspense>
  );
}
