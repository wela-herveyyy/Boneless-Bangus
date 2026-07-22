import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/domain/usecases/auth/get_session.usecase";
import { refreshAndGetAccessToken } from "@/lib/domain/usecases/google_workspace_auth/refresh_and_get_access_token.usecase";
import { sendGmailMessageUseCase } from "@/lib/domain/usecases/mcp_google_workspace/gmail.usecases";
import {
  createCalendarEventUseCase,
  updateCalendarEventUseCase,
  deleteCalendarEventUseCase,
} from "@/lib/domain/usecases/mcp_google_workspace/calendar.usecases";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  const { toolName, args } = body;
  if (!toolName || typeof toolName !== "string" || !args || typeof args !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const token = await refreshAndGetAccessToken(userId);
    let result = null;

    switch (toolName) {
      case "send_email":
        await sendGmailMessageUseCase(token, args.to, args.subject, args.body);
        result = { ok: true, message: `Email sent to ${args.to}` };
        break;
      case "create_calendar_event":
        const createRes = await createCalendarEventUseCase(
          token,
          args.summary,
          args.description || "",
          args.start,
          args.end,
          args.addGoogleMeet
        );
        result = { ok: true, htmlLink: createRes.htmlLink };
        break;
      case "update_calendar_event":
        const updateRes = await updateCalendarEventUseCase(token, args.eventId, {
          summary: args.summary,
          description: args.description,
          start: args.start,
          end: args.end,
        });
        result = { ok: true, htmlLink: updateRes.htmlLink };
        break;
      case "delete_calendar_event":
        await deleteCalendarEventUseCase(token, args.eventId);
        result = { ok: true, message: `Event deleted.` };
        break;
      default:
        return NextResponse.json({ error: "Unknown tool called." }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Failed to execute ${toolName}:`, error);
    return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
  }
}
