import { redirect } from "next/navigation";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string; callbackURL?: string }>;
};

/** Registration removed — Livro ERP login creates / onboards users. */
export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const target = new URLSearchParams();
  if (params.callbackURL) target.set("callbackURL", params.callbackURL);
  if (params.error) target.set("error", params.error);
  const qs = target.toString();
  redirect(qs ? `/sign-in?${qs}` : "/sign-in");
}
