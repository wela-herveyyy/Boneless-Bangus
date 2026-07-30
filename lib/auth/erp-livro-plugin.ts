import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import * as z from "zod";
import { loginLivroErp } from "@/lib/domain/usecases/erpnext/login_livro.usecase";
import { getErpLoggedUser } from "@/lib/domain/usecases/erpnext/get_logged_user.usecase";
import { getErpUserProfile } from "@/lib/domain/usecases/erpnext/get_erp_user_profile.usecase";
import { getUserRole } from "@/lib/domain/usecases/users/get_user_role.usecase";
import { ERP_BASE_URL, normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { isLivroParent } from "@/lib/utils/erp-embed";

const PROVIDER_ID = "erp-livro";

const passwordBodySchema = z.object({
  usr: z.string().optional(),
  pwd: z.string().optional(),
  tmp_id: z.string().optional(),
  otp: z.string().optional(),
  /** ERP origin to login against; defaults to Livro */
  parent: z.string().optional(),
  callbackURL: z.string().optional(),
});

const sidBodySchema = z.object({
  sid: z.string().min(1),
  parent: z.string().optional(),
  callbackURL: z.string().optional(),
});

function toAppEmail(erpUser: string, loginUsr?: string): string {
  const candidates = [erpUser, loginUsr?.trim() ?? ""].filter(Boolean);
  for (const value of candidates) {
    if (z.email().safeParse(value).success) return value.toLowerCase();
  }
  const local = erpUser.replace(/[^a-zA-Z0-9._+-]/g, "_").slice(0, 64) || "user";
  return `${local.toLowerCase()}@livro.local`;
}

// better-auth endpoint ctx — keep loose to avoid fighting internal adapter generics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertLivroUserAndSession(ctx: any, input: {
  email: string;
  accountId: string;
  fullName: string;
}) {
  const existing = await ctx.context.internalAdapter.findUserByEmail(input.email, {
    includeAccounts: true,
  });

  let user = existing?.user ?? null;
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await ctx.context.internalAdapter.createUser({
      email: input.email,
      name: input.fullName || input.email,
      emailVerified: true,
    });
    if (!user) {
      throw APIError.from("INTERNAL_SERVER_ERROR", {
        message: "Failed to create user.",
        code: "USER_CREATE_FAILED",
      });
    }
    await ctx.context.internalAdapter.createAccount({
      userId: user.id,
      providerId: PROVIDER_ID,
      accountId: input.accountId,
    });
  } else {
    const hasProvider = existing?.accounts.some(
      (a: { providerId: string }) => a.providerId === PROVIDER_ID,
    );
    if (!hasProvider) {
      await ctx.context.internalAdapter.createAccount({
        userId: user.id,
        providerId: PROVIDER_ID,
        accountId: input.accountId,
      });
    }
    if (input.fullName && input.fullName !== user.name) {
      user = await ctx.context.internalAdapter.updateUser(user.id, { name: input.fullName });
    }
  }

  const session = await ctx.context.internalAdapter.createSession(user.id);
  if (!session) {
    throw APIError.from("INTERNAL_SERVER_ERROR", {
      message: "Failed to create session.",
      code: "SESSION_CREATE_FAILED",
    });
  }

  return { user, session, isNewUser };
}

/**
 * App login via Livro ERPNext. Creates a Better Auth session and returns the ERP sid
 * so the client can wire Livro MCP (`Authorization: Bearer ${sid}`).
 */
export function erpLivroPlugin(): BetterAuthPlugin {
  return {
    id: "erp-livro",
    endpoints: {
      signInErpLivro: createAuthEndpoint(
        "/sign-in/erp-livro",
        {
          method: "POST",
          body: passwordBodySchema,
          metadata: {
            openapi: {
              description: "Sign in with ERPNext credentials (Livro or parent site)",
            },
          },
        },
        async (ctx) => {
          const { usr, pwd, tmp_id, otp, parent, callbackURL } = ctx.body;
          const erpBase = normalizeErpBaseUrl(parent || ERP_BASE_URL) || undefined;

          const loginResult =
            tmp_id && otp
              ? await loginLivroErp({ tmp_id, otp, usr, baseUrl: erpBase })
              : await loginLivroErp({ usr: usr ?? "", pwd: pwd ?? "", baseUrl: erpBase });

          if (!loginResult.ok) {
            throw APIError.from("UNAUTHORIZED", {
              message: loginResult.error,
              code: "ERP_LOGIN_FAILED",
            });
          }

          if ("needs_otp" in loginResult.data && loginResult.data.needs_otp) {
            return ctx.json({
              ok: true,
              needs_otp: true,
              tmp_id: loginResult.data.tmp_id,
              prompt: loginResult.data.prompt,
              method: loginResult.data.method,
            });
          }

          const { sid, fullName, baseUrl } = loginResult.data;
          const profile = await getErpUserProfile(baseUrl, sid);
          if (!profile.ok) {
            // Fall back to get_logged_user if User doc is restricted
            const logged = await getErpLoggedUser(baseUrl, sid);
            if (!logged.ok) {
              throw APIError.from("UNAUTHORIZED", {
                message: logged.error,
                code: "ERP_SESSION_INVALID",
              });
            }
            const email = toAppEmail(logged.data.email, usr);
            const { user, session, isNewUser } = await upsertLivroUserAndSession(ctx, {
              email,
              accountId: `${baseUrl}:${logged.data.email}`,
              fullName: fullName || email,
            });
            await setSessionCookie(ctx, { session, user });
            const role = await getUserRole(user.id);
            return ctx.json({
              ok: true,
              sid,
              fullName: user.name,
              email,
              baseUrl,
              isLivro: isLivroParent(baseUrl),
              isNewUser,
              needsOnboarding: !role,
              callbackURL: callbackURL || "/workspace",
              user: { id: user.id, name: user.name, email: user.email },
            });
          }

          const email = toAppEmail(profile.data.email, usr);
          const { user, session, isNewUser } = await upsertLivroUserAndSession(ctx, {
            email,
            accountId: `${baseUrl}:${profile.data.userName}`,
            fullName: profile.data.fullName || fullName || email,
          });

          await setSessionCookie(ctx, { session, user });

          const role = await getUserRole(user.id);

          return ctx.json({
            ok: true,
            sid,
            fullName: user.name,
            email,
            baseUrl,
            isLivro: isLivroParent(baseUrl),
            isNewUser,
            needsOnboarding: !role,
            callbackURL: callbackURL || "/workspace",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          });
        },
      ),

      /**
       * Silent login when ERPNext FAB / external app passes `sid` + any parent origin
       * (Livro, school, localhost, etc.). Parent must be a valid http(s) origin.
       */
      signInErpLivroSid: createAuthEndpoint(
        "/sign-in/erp-livro-sid",
        {
          method: "POST",
          body: sidBodySchema,
          metadata: {
            openapi: {
              description: "Sign in with an existing ERPNext sid from any parent site (embed / FAB)",
            },
          },
        },
        async (ctx) => {
          const sid = ctx.body.sid.trim();
          const parent = normalizeErpBaseUrl(ctx.body.parent || ERP_BASE_URL);
          const callbackURL = ctx.body.callbackURL || "/";

          if (!parent) {
            throw APIError.from("BAD_REQUEST", {
              message: "A valid parent URL origin is required (e.g. http://127.0.0.1:8007).",
              code: "ERP_PARENT_INVALID",
            });
          }

          const profile = await getErpUserProfile(parent, sid);
          if (!profile.ok) {
            throw APIError.from("UNAUTHORIZED", {
              message: profile.error,
              code: "ERP_SESSION_INVALID",
            });
          }

          const email = toAppEmail(profile.data.email);
          const { user, session, isNewUser } = await upsertLivroUserAndSession(ctx, {
            email,
            accountId: `${parent}:${profile.data.userName}`,
            fullName: profile.data.fullName || email,
          });

          await setSessionCookie(ctx, { session, user });

          const role = await getUserRole(user.id);

          return ctx.json({
            ok: true,
            sid,
            fullName: user.name,
            email,
            baseUrl: parent,
            isLivro: isLivroParent(parent),
            isNewUser,
            needsOnboarding: !role,
            callbackURL,
            erpUser: {
              name: profile.data.userName,
              path: profile.data.userPath,
              fullName: profile.data.fullName,
            },
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          });
        },
      ),
    },
  };
}
