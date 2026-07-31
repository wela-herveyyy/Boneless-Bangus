import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import type { FrappeOutputTarget } from "@/lib/entities/frappe_output.type";
import { fetchFrappeOutput } from "@/lib/domain/usecases/erpnext/fetch_frappe_output.usecase";
import { resolveErpBaseUrl } from "@/lib/domain/usecases/erpnext/resolve_erp_base_url.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";

const encoder = new TextEncoder();

function sse(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Stream a Frappe print format / webpage / webform HTML preview (SSE).
 * Body: { sid, baseUrl, target }
 */
export async function POST(request: Request) {
  const userSession = await auth();
  if (!userSession || userSession.expired) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    sid?: string;
    baseUrl?: string;
    target?: FrappeOutputTarget;
  };

  const sid = body.sid?.trim();
  const baseUrl = resolveErpBaseUrl(body.baseUrl);
  const target = body.target;

  if (!sid || !baseUrl || !target?.kind) {
    return Response.json(
      { ok: false, error: "sid, baseUrl, and target.kind are required." },
      { status: 400 },
    );
  }

  if (!hasPermission(userSession.user.permissions, erpPermissionForBaseUrl(baseUrl))) {
    return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(sse({ type: "status", message: "Connecting to school ERP…" }));
        controller.enqueue(
          sse({ type: "status", message: `Loading ${target.kind.replace("_", " ")}…` }),
        );

        const result = await fetchFrappeOutput({ sid, baseUrl, target });
        if (!result.ok) {
          controller.enqueue(sse({ type: "error", message: result.error }));
          controller.close();
          return;
        }

        controller.enqueue(
          sse({
            type: "meta",
            title: result.data.title,
            sourceUrl: result.data.sourceUrl,
            kind: result.data.kind,
          }),
        );

        const html = result.data.html;
        const chunkSize = 6_000;
        for (let i = 0; i < html.length; i += chunkSize) {
          controller.enqueue(sse({ type: "html", chunk: html.slice(i, i + chunkSize) }));
          // Yield so the browser can paint progressively
          await new Promise((r) => setTimeout(r, 0));
        }

        controller.enqueue(sse({ type: "done" }));
        controller.close();
      } catch (error) {
        controller.enqueue(
          sse({
            type: "error",
            message: error instanceof Error ? error.message : "Stream failed.",
          }),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
