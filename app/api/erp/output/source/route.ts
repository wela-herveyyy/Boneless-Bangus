import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import type { FrappeOutputTarget } from "@/lib/entities/frappe_output.type";
import {
  fetchFrappeSourceDoc,
  saveFrappeSourceDoc,
} from "@/lib/domain/usecases/erpnext/frappe_source_doc.usecase";
import { resolveErpBaseUrl } from "@/lib/domain/usecases/erpnext/resolve_erp_base_url.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";

/**
 * Load / save Frappe source fields (Web Page, Web Form, Print Format)
 * using the School MCP SID — powers the Output Source editor tab.
 */
export async function POST(request: Request) {
  const userSession = await auth();
  if (!userSession || userSession.expired) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: "get" | "save";
    sid?: string;
    baseUrl?: string;
    target?: FrappeOutputTarget;
    doctype?: string;
    name?: string;
    fields?: Record<string, string>;
  } | null;

  const sid = body?.sid?.trim();
  const baseUrl = resolveErpBaseUrl(body?.baseUrl);
  if (!sid || !baseUrl) {
    return Response.json(
      { ok: false, error: "sid and baseUrl are required." },
      { status: 400 },
    );
  }

  if (!hasPermission(userSession.user.permissions, erpPermissionForBaseUrl(baseUrl))) {
    return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
  }

  const action = body?.action ?? "get";

  if (action === "get") {
    if (!body?.target?.kind) {
      return Response.json({ ok: false, error: "target is required." }, { status: 400 });
    }
    const result = await fetchFrappeSourceDoc({
      sid,
      baseUrl,
      target: body.target,
    });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 404 });
    }
    return Response.json({ ok: true, data: result.data });
  }

  if (action === "save") {
    if (!body?.doctype || !body?.name || !body.fields) {
      return Response.json(
        { ok: false, error: "doctype, name, and fields are required." },
        { status: 400 },
      );
    }
    const result = await saveFrappeSourceDoc({
      sid,
      baseUrl,
      doctype: body.doctype,
      name: body.name,
      fields: body.fields,
    });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }
    return Response.json({ ok: true, data: result.data });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
