import { headers } from "next/headers";
import { auth } from "@/auth";
import type { AuthSession } from "@/lib/entities/auth.type";

function toAuthSession(
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>,
): AuthSession {
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}

export async function getSessionFromHeaders(
  requestHeaders: Headers,
): Promise<AuthSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session) {
      return null;
    }

    return toAuthSession(session);
  } catch (error) {
    // MySQL blips / too many connections — don't crash the whole request
    console.error("[getSession]", error);
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  return getSessionFromHeaders(await headers());
}
