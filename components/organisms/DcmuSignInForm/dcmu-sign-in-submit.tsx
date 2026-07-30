"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/atoms/Button/Button";
import { useAuthFormSubmitStyles } from "@/components/atoms/Button/button.hooks";

export function DcmuSignInSubmit() {
  const { pending } = useFormStatus();
  const submitClassName = useAuthFormSubmitStyles();

  return (
    <Button type="submit" className={submitClassName} disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
