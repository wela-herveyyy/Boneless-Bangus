"use client";

import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/entities/users.type";
import { ProfileView } from "./ProfileView";

type ProfilePageProps = {
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: UserRole | null;
  userSettings: {
    cursorApiKey: string | null;
    geminiApiKey: string | null;
  } | null;
  userTeam: {
    teamId: string;
    teamCode: string;
    teamName: string;
    cursorApiKey: string | null;
    geminiApiKey: string | null;
    isManager: boolean;
  } | null;
};

/** Own settings page — wraps ProfileView as a dedicated route. */
export function ProfilePage(props: ProfilePageProps) {
  const router = useRouter();
  return (
    <ProfileView
      {...props}
      onClose={() => router.push("/workspace")}
    />
  );
}
