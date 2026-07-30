import { redirect } from "next/navigation";
import { getSession } from "@/lib/domain/services/auth.service";
import { getUserRole } from "@/lib/domain/usecases/users/get_user_role.usecase";
import { USER_ROLE } from "@/lib/entities/users.type";
import { DcmuSignInForm } from "@/components/organisms/DcmuSignInForm/dcmu-sign-in-form";

type DcmuPageProps = {
  searchParams: Promise<{
    error?: string;
    callbackURL?: string;
  }>;
};

export default async function DcmuPage({ searchParams }: DcmuPageProps) {
  const session = await getSession();
  if (session) {
    const role = await getUserRole(session.user.id);
    if (role === USER_ROLE.OWNER || role === USER_ROLE.ADMIN) {
      redirect("/workspace");
    }
  }

  return <DcmuSignInForm searchParams={searchParams} />;
}
