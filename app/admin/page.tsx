import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminPage as AdminPageView } from "@/components/client-pages/admin/AdminPage";
import { getUsersAction } from "@/lib/domain/actions/users.actions";
import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

export const metadata: Metadata = {
  title: "BBAI | Admin",
  description: "Manage teams, user access, and review prompt history.",
};

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-sm text-on-surface-muted">Loading admin…</p>
    </div>
  );
}

async function AdminContent() {
  const userSession = await auth();
  if (!userSession || userSession.expired) {
    redirect("/sign-in?callbackURL=/admin");
  }

  if (!hasPermission(userSession.user.permissions, USER_PERMISSION.TEAMS_MANAGE)) {
    redirect("/workspace?error=" + encodeURIComponent("Admin access required."));
  }

  const usersResult = await getUsersAction();
  if (!usersResult.ok) {
    redirect(`/sign-in?callbackURL=/admin&error=${encodeURIComponent(usersResult.error)}`);
  }

  return (
    <AdminPageView
      initialUsers={usersResult.data}
      currentUserId={userSession.user.id}
      currentUserName={userSession.user.name?.trim() || userSession.user.email || "Admin"}
      currentUserRole={userSession.user.role}
    />
  );
}

export default function AdminRoutePage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent />
    </Suspense>
  );
}
