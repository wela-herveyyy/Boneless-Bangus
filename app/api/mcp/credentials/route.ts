import { auth } from "@/lib/domain/services/auth.service";
import { saveCredential } from "@/lib/domain/services/mcp_credential.service";
import { z } from "zod";

const SaveCredentialPayloadSchema = z.object({
  slug: z.string().min(1).max(100),
  label: z.string().max(100).optional().default("API Key"),
  plaintext: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = SaveCredentialPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid request payload.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { slug, label, plaintext } = parsed.data;
    const credentialRef = await saveCredential(userSession.user.id, slug, label, plaintext);

    return Response.json({ ok: true, credentialRef });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save credential.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
