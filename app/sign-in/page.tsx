import { SignInForm } from "@/components/organisms/SignInForm/sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    callbackURL?: string;
    sid?: string;
    erp_sid?: string;
    parent?: string;
    erp?: string;
    erp_url?: string;
  }>;
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  return <SignInForm searchParams={searchParams} />;
}
