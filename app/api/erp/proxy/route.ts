import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

const ERP_URL = "https://erp.livro.systems";

export async function POST(request: Request) {
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    if (!hasPermission(userSession.user.role, USER_PERMISSION.ERPNEXT_ACCESS)) {
      return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json()) as {
      sid: string;
      doctype: string;
      fields?: string[];
      filters?: unknown[];
      limit?: number;
      orderBy?: string;
    };

    if (!body.sid || !body.doctype) {
      return Response.json({ ok: false, error: "sid and doctype are required." }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set("fields", JSON.stringify(body.fields ?? ["*"]));
    if (body.filters) params.set("filters", JSON.stringify(body.filters));
    if (body.limit) params.set("limit_page_length", String(body.limit));
    if (body.orderBy) params.set("order_by", body.orderBy);

    const encodedDoctype = encodeURIComponent(body.doctype);
    const url = `${ERP_URL}/api/resource/${encodedDoctype}?${params.toString()}`;

    const erpRes = await fetch(url, {
      headers: {
        Accept: "application/json",
        Cookie: `sid=${body.sid}`,
      },
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
