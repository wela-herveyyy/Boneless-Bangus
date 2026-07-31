"use server";

import { redirect } from "next/navigation";
import {
  signIn,
  signOut,
  signUp,
} from "@/lib/domain/services/auth.service";
import { getUserRole } from "@/lib/domain/usecases/users/get_user_role.usecase";
import { USER_ROLE } from "@/lib/entities/users.type";

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function isDcmuAllowedRole(role: string | null): boolean {
  return role === USER_ROLE.OWNER || role === USER_ROLE.ADMIN;
}

export async function signInAction(formData: FormData) {
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const callbackURL = readField(formData, "callbackURL") || "/onboarding";

  const result = await signIn({ email, password, callbackURL, rememberMe: true });

  if (!result.ok) {
    redirect(`/sign-in?error=${encodeURIComponent(result.error)}`);
  }

  redirect(callbackURL);
}

/** In-app email/password login for owner & admin only (`/dcmu`). */
export async function dcmuSignInAction(formData: FormData) {
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const callbackURL = readField(formData, "callbackURL") || "/workspace";

  const result = await signIn({ email, password, callbackURL, rememberMe: true });

  if (!result.ok) {
    redirect(`/dcmu?error=${encodeURIComponent(result.error)}`);
  }

  const role = await getUserRole(result.data.id);
  if (!isDcmuAllowedRole(role)) {
    await signOut();
    redirect(
      `/dcmu?error=${encodeURIComponent(
        "This login is for owner and admin only. Use ERP sign-in at /sign-in.",
      )}`,
    );
  }

  redirect(callbackURL.startsWith("/") ? callbackURL : "/workspace");
}

export async function signUpAction(formData: FormData) {
  const name = readField(formData, "name");
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const callbackURL = readField(formData, "callbackURL") || "/onboarding";

  const result = await signUp({ name, email, password, callbackURL });

  if (!result.ok) {
    redirect(`/sign-up?error=${encodeURIComponent(result.error)}`);
  }

  redirect(callbackURL);
}

export async function signOutAction() {
  const result = await signOut();

  if (!result.ok) {
    redirect(`/?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/sign-in");
}
