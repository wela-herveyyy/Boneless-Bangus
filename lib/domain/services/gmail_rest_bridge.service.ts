/**
 * Transparent REST bridge for Gmail MCP tools.
 *
 * When `gmail-mcp` tools (`search_threads`, `create_draft`, `get_message`, etc.) are invoked
 * by the AI model in chat, Google's hosted ESF proxy (`gmailmcp.googleapis.com`) rejects consumer
 * `@gmail.com` accounts with `"The caller does not have permission"`.
 *
 * This bridge seamlessly executes those exact tool schemas against the standard Gmail REST API
 * (`gmail.googleapis.com`) using the user's valid OAuth Bearer access token.
 */

export async function executeGmailRestTool(
  toolName: string,
  args: Record<string, unknown>,
  authHeader: string
): Promise<{ ok: boolean; content: string }> {
  const headers = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  try {
    switch (toolName) {
      case "search_threads": {
        const query = String(args.query || "");
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=10`,
          { headers }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "get_thread": {
        const id = String(args.id || args.threadId || "");
        if (!id) return { ok: false, content: "Missing required thread id parameter" };
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(id)}`,
          { headers }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "get_message": {
        const id = String(args.id || args.messageId || "");
        if (!id) return { ok: false, content: "Missing required message id parameter" };
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`,
          { headers }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "list_drafts": {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=20`, {
          headers,
        });
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "create_draft": {
        // Construct RFC 822 raw message
        const to = String(args.recipient || args.to || "");
        const subject = String(args.subject || "");
        const body = String(args.body || args.content || "");
        
        let rawEmail = "";
        if (to) rawEmail += `To: ${to}\r\n`;
        if (subject) rawEmail += `Subject: ${subject}\r\n`;
        rawEmail += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;

        // Base64url encode the raw RFC 822 string
        const base64Encoded = Buffer.from(rawEmail, "utf-8")
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: { raw: base64Encoded } }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "list_labels": {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/labels`, { headers });
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "label_thread":
      case "unlabel_thread": {
        const id = String(args.id || args.threadId || "");
        const labelId = String(args.labelId || args.label || "");
        if (!id || !labelId) return { ok: false, content: "Missing required thread id or labelId" };

        const payload =
          toolName === "label_thread"
            ? { addLabelIds: [labelId] }
            : { removeLabelIds: [labelId] };

        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(id)}/modify`,
          { method: "POST", headers, body: JSON.stringify(payload) }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "label_message":
      case "unlabel_message": {
        const id = String(args.id || args.messageId || "");
        const labelId = String(args.labelId || args.label || "");
        if (!id || !labelId) return { ok: false, content: "Missing required message id or labelId" };

        const payload =
          toolName === "label_message"
            ? { addLabelIds: [labelId] }
            : { removeLabelIds: [labelId] };

        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}/modify`,
          { method: "POST", headers, body: JSON.stringify(payload) }
        );
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      case "create_label": {
        const name = String(args.name || "");
        if (!name) return { ok: false, content: "Missing label name parameter" };
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/labels`, {
          method: "POST",
          headers,
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return { ok: false, content: `Gmail API error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { ok: true, content: JSON.stringify(data, null, 2) };
      }

      default: {
        return { ok: false, content: `Unsupported Gmail REST tool mapping for: ${toolName}` };
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, content: `Error executing ${toolName} via Gmail REST API: ${msg}` };
  }
}
