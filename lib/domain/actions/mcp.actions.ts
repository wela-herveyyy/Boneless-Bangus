"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { saveCredential } from "@/lib/domain/services/mcp_credential.service";
import { z } from "zod";
import type { UserResult } from "@/lib/entities/users.type";

const SaveCredentialPayloadSchema = z.object({
  slug: z.string().min(1).max(100),
  label: z.string().max(100).optional().default("API Key"),
  plaintext: z.string().min(1),
});

export async function saveMcpCredentialAction(formData: FormData): Promise<UserResult<{ credentialRef: string }>> {
  const action = "mcp:save-credential";

  try {
    // 1. Authentication
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    // 2. Authorization
    if (!hasPermission(userSession.user.role, USER_PERMISSION.GOOGLE_AI_INTERACT)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const payload = {
      slug: formData.get("slug"),
      label: formData.get("label"),
      plaintext: formData.get("plaintext"),
    };

    const parsed = SaveCredentialPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Invalid payload.", role: userSession.user.role });
      return { ok: false, error: "Invalid request payload." };
    }

    const { slug, label, plaintext } = parsed.data;
    const credentialRef = await saveCredential(userSession.user.id, slug, label, plaintext);

    // 3. Accounting
    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });

    return { ok: true, data: { credentialRef } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}
