import { AuthShell } from "@/components/organisms/AuthShell/AuthShell";
import { LabelInput } from "@/components/molecules/LabelInput/LabelInput";
import { dcmuSignInAction } from "@/lib/domain/actions/auth.actions";
import { DcmuSignInSubmit } from "./dcmu-sign-in-submit";

type DcmuSignInFormProps = {
  searchParams: Promise<{
    error?: string;
    callbackURL?: string;
  }>;
};

export async function DcmuSignInForm({ searchParams }: DcmuSignInFormProps) {
  const params = await searchParams;
  const callbackURL = params.callbackURL || "/workspace";

  return (
    <AuthShell
      title="DCMU login"
      description="In-app sign-in for owner and admin. School users should use ERP sign-in."
      variant="sign-in"
    >
      <form action={dcmuSignInAction} className="space-y-5">
        <input type="hidden" name="callbackURL" value={callbackURL} />

        {params.error ? (
          <p className="rounded-xl bg-secondary-container px-4 py-3 text-sm text-secondary">
            {params.error}
          </p>
        ) : null}

        <LabelInput
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@company.com"
        />
        <LabelInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />

        <DcmuSignInSubmit />

        <p className="text-center text-sm text-on-surface-muted">
          ERP / school login is at{" "}
          <a href="/sign-in" className="font-medium text-primary underline">
            /sign-in
          </a>
          .
        </p>
      </form>
    </AuthShell>
  );
}
