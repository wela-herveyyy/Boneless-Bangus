import { SignInForm } from "@/components/organisms/SignInForm/sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; callbackURL?: string }>;
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  return <SignInForm searchParams={searchParams} />;
}
