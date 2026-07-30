import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspacePage } from "@/components/client-pages/workspace/WorkspacePage";
import { auth, getSession } from "@/lib/domain/services/auth.service";
import { getProfileService } from "@/lib/domain/services/profile.service";
import { hasPermission, USER_PERMISSION, type UserRole } from "@/lib/entities/users.type";
import { normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { isLivroParent } from "@/lib/utils/erp-embed";

export const metadata: Metadata = {
  title: "BBAI | Workspace",
  description: "Boneless Bangus AI workspace — tasks, bugs, and school setup support.",
};

type WorkspacePageProps = {
  searchParams: Promise<{
    embed?: string;
    parent?: string;
    school_mcp?: string;
  }>;
};

function embedQs(params: {
  embed?: string;
  parent?: string;
  school_mcp?: string;
}): string {
  const qs = new URLSearchParams();
  const parent = normalizeErpBaseUrl(params.parent || "");
  if (parent) {
    qs.set("parent", parent);
    qs.set("embed", params.embed || "1");
    if (params.school_mcp || !isLivroParent(parent)) {
      qs.set("school_mcp", params.school_mcp || "auto");
    }
  } else if (params.embed) {
    qs.set("embed", params.embed);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function Page({ searchParams }: WorkspacePageProps) {
  const params = await searchParams;
  const qs = embedQs(params);
  const cookieSession = await getSession();

  if (!cookieSession) {
    const signIn = new URLSearchParams();
    signIn.set("callbackURL", `/workspace${qs}`);
    if (params.parent) signIn.set("parent", params.parent);
    if (params.embed) signIn.set("embed", params.embed);
    if (params.school_mcp) signIn.set("school_mcp", params.school_mcp);
    redirect(`/sign-in?${signIn.toString()}`);
  }

  // Cookie session but no role → onboarding (not sign-in — that loops forever)
  const userSession = await auth();
  if (!userSession || userSession.expired) {
    redirect(`/${qs}`);
  }

  const profileData = await getProfileService(userSession.user.id);
  const showAdminLink = hasPermission(userSession.user.permissions, USER_PERMISSION.TEAMS_MANAGE);

  return (
    <WorkspacePage
      userId={userSession.user.id}
      userName={userSession.user.name}
      userEmail={userSession.user.email}
      userSettings={profileData.settings}
      userTeam={profileData.team}
      showAdminLink={showAdminLink}
      userRole={profileData.role as UserRole}
    />
  );
}
