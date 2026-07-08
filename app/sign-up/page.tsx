import { SignUpForm } from "@/components/organisms/SignUpForm/sign-up-form";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string; callbackURL?: string }>;
};

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  return <SignUpForm searchParams={searchParams} />;
}
