"use client";

import { LabelInput } from "@/components/molecules/LabelInput/LabelInput";
import { Button } from "@/components/atoms/Button/Button";
import { useAuthFormSubmitStyles } from "@/components/atoms/Button/button.hooks";
import { getSignInCopy } from "@/lib/utils/erp-sign-in-copy";
import { useErpPasswordSignIn } from "./signInForm.hooks";

type ErpPasswordSignInFormProps = {
  callbackURL: string;
  initialError?: string;
  /** ERP origin — Livro fallback resolved by parent page. */
  erpBaseUrl: string;
};

/** @deprecated name kept for imports — works for any ERP parent URL */
export function ErpLivroSignInForm(props: ErpPasswordSignInFormProps) {
  return <ErpPasswordSignInForm {...props} />;
}

export function ErpPasswordSignInForm({
  callbackURL,
  initialError,
  erpBaseUrl,
}: ErpPasswordSignInFormProps) {
  const copy = getSignInCopy(erpBaseUrl);
  const submitClassName = useAuthFormSubmitStyles();
  const {
    usr,
    setUsr,
    pwd,
    setPwd,
    otp,
    setOtp,
    tmpId,
    otpPrompt,
    loading,
    error,
    login,
    verifyOtp,
    cancelOtp,
  } = useErpPasswordSignIn({ callbackURL, initialError, erpBaseUrl });

  return (
    <div className="space-y-5">
      {!copy.isLivro ? (
        <p className="rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface-muted">
          ERP site: <span className="font-medium text-on-surface">{copy.host}</span>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-secondary-container px-4 py-3 text-sm text-secondary">
          {error}
        </p>
      ) : null}

      {tmpId ? (
        <>
          <p className="text-sm text-on-surface-muted">{otpPrompt}</p>
          <LabelInput
            label="Verification code"
            name="otp"
            type="text"
            autoComplete="one-time-code"
            required
            placeholder="Enter code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button
            type="button"
            className={submitClassName}
            disabled={loading || !otp.trim()}
            onClick={verifyOtp}
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </Button>
          <button
            type="button"
            onClick={cancelOtp}
            className="w-full text-center text-sm font-medium text-primary underline"
          >
            Back to password
          </button>
        </>
      ) : (
        <>
          <LabelInput
            label={copy.emailLabel}
            name="usr"
            type="email"
            autoComplete="username"
            required
            placeholder={copy.emailPlaceholder}
            value={usr}
            onChange={(e) => setUsr(e.target.value)}
          />
          <LabelInput
            label="Password"
            name="pwd"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <Button
            type="button"
            className={submitClassName}
            disabled={loading || !usr.trim() || !pwd}
            onClick={login}
          >
            {loading ? "Signing in…" : copy.submitLabel}
          </Button>
          <p className="text-center text-sm text-on-surface-muted">{copy.footer}</p>
        </>
      )}
    </div>
  );
}
