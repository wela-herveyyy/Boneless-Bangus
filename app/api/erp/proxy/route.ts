import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import { resolveErpBaseUrl } from "@/lib/domain/usecases/erpnext/resolve_erp_base_url.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";

type ProxyBody = {
  sid: string;
  doctype: string;
  /** list (default) | count via frappe.client.get_count | get single doc */
  action?: "list" | "count" | "get";
  name?: string;
  fields?: string[];
  filters?: unknown;
  limit?: number;
  orderBy?: string;
  baseUrl?: string;
};

export async function POST(request: Request) {
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as ProxyBody;

    if (!body.sid || !body.doctype) {
      return Response.json({ ok: false, error: "sid and doctype are required." }, { status: 400 });
    }

    const erpUrl = resolveErpBaseUrl(body.baseUrl);
    if (!erpUrl) {
      return Response.json({ ok: false, error: "Invalid ERP URL." }, { status: 400 });
    }

    if (!hasPermission(userSession.user.permissions, erpPermissionForBaseUrl(erpUrl))) {
      return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: `sid=${body.sid}`,
    };

    const action = body.action ?? "list";

    if (action === "count") {
      const erpRes = await fetch(`${erpUrl}/api/method/frappe.client.get_count`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          doctype: body.doctype,
          filters: body.filters ?? [],
        }),
        cache: "no-store",
      });
      if (!erpRes.ok) {
        return Response.json(
          { ok: false, error: `ERPNext returned ${erpRes.status}` },
          { status: erpRes.status },
        );
      }
      const json = (await erpRes.json()) as { message?: number };
      const count = typeof json.message === "number" ? json.message : 0;
      return Response.json({ ok: true, data: count });
    }

    if (action === "get") {
      const docName = encodeURIComponent(body.name || body.doctype);
      const encodedDoctype = encodeURIComponent(body.doctype);
      const erpRes = await fetch(`${erpUrl}/api/resource/${encodedDoctype}/${docName}`, {
        headers: {
          Accept: "application/json",
          Cookie: `sid=${body.sid}`,
        },
        cache: "no-store",
      });
      if (!erpRes.ok) {
        return Response.json(
          { ok: false, error: `ERPNext returned ${erpRes.status}` },
          { status: erpRes.status },
        );
      }
      const json = (await erpRes.json()) as { data?: unknown };
      return Response.json({ ok: true, data: json.data ?? null });
    }

    const params = new URLSearchParams();
    params.set("fields", JSON.stringify(body.fields ?? ["*"]));
    if (body.filters) params.set("filters", JSON.stringify(body.filters));
    if (body.limit) params.set("limit_page_length", String(body.limit));
    if (body.orderBy) params.set("order_by", body.orderBy);

    const encodedDoctype = encodeURIComponent(body.doctype);
    const url = `${erpUrl}/api/resource/${encodedDoctype}?${params.toString()}`;

    const erpRes = await fetch(url, {
      headers: {
        Accept: "application/json",
        Cookie: `sid=${body.sid}`,
      },
      cache: "no-store",
    });

    if (!erpRes.ok) {
      return Response.json(
        { ok: false, error: `ERPNext returned ${erpRes.status}` },
        { status: erpRes.status },
      );
    }

    const json = (await erpRes.json()) as { data?: unknown[] };

    return Response.json({ ok: true, data: json.data ?? [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error.";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
