function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function searchGmailThreadsUseCase(token: string, query: string, maxResults: number = 1) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    { headers: getHeaders(token) }
  );
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  return await res.json();
}

/** Strip HTML tags and collapse whitespace to get readable plain text. */
function stripHtml(html: string): string {
  return html
    // Remove <style> and <script> blocks entirely (including their content)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Replace block-level / row-level tags with newlines
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|tr|li|h[1-6]|blockquote|table|thead|tbody|tfoot)[^>]*>/gi, "\n")
    // Table cells and common structural tags → space separator
    .replace(/<\/?(td|th|span|a|strong|em|b|i|u|font)[^>]*>/gi, " ")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Strip invisible/zero-width characters commonly used as email spam filler
    .replace(/&zwnj;|&zwj;|&shy;|&rlm;|&lrm;|&#8203;|&#8204;|&#8205;/g, "")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      // Drop control characters and zero-width Unicode
      if (n < 32 || (n >= 0x200b && n <= 0x200f) || n === 0xfeff) return "";
      return String.fromCharCode(n);
    })
    // Collapse whitespace within lines, then drop blank lines
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    // Collapse runs of 3+ newlines to 2 (paragraph spacing)
    .replace(/\n{3,}/g, "\n\n");
}

function extractPlainText(payload: any): string {
  if (!payload) return "";

  // Prefer text/plain directly
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  // Recurse into multipart/* — prefer plain over html
  if (payload.parts && Array.isArray(payload.parts)) {
    let htmlFallback = "";
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) {
        // If the part itself was HTML and already stripped, save it as fallback
        if (!htmlFallback && part.mimeType?.startsWith("text/html")) {
          htmlFallback = text;
        } else {
          return text; // plain text found — return immediately
        }
      }
    }
    if (htmlFallback) return htmlFallback;
  }

  // Last resort: decode whatever body data is present
  if (payload.body?.data) {
    const raw = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    // Strip HTML if this part is text/html (or looks like HTML)
    if (payload.mimeType === "text/html" || raw.trimStart().startsWith("<")) {
      return stripHtml(raw);
    }
    return raw;
  }

  return "";
}

function formatMessage(message: any) {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const plainText = extractPlainText(message.payload);

  return {
    id: message.id,
    snippet: message.snippet,
    subject: getHeader("subject"),
    from: getHeader("from"),
    date: getHeader("date"),
    body: plainText.length > 2000 ? plainText.substring(0, 2000) + "... [TRUNCATED]" : plainText
  };
}

export async function getGmailThreadUseCase(token: string, id: string, maxMessages: number = 5) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(id)}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  const data = await res.json();
  
  if (data.messages && Array.isArray(data.messages)) {
    // Keep only the most recent messages to prevent overflowing the LLM context, based on maxMessages
    const recentMessages = data.messages.length > maxMessages ? data.messages.slice(-maxMessages) : data.messages;
    data.messages = recentMessages.map(formatMessage);
  }
  
  return data;
}

export async function getGmailMessageUseCase(token: string, id: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  const data = await res.json();
  return formatMessage(data);
}

export async function listGmailDraftsUseCase(token: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=20`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  return await res.json();
}

export async function createGmailDraftUseCase(token: string, to: string, subject: string, body: string) {
  let rawEmail = "";
  if (to) rawEmail += `To: ${to}\r\n`;
  if (subject) rawEmail += `Subject: ${subject}\r\n`;
  rawEmail += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;

  const base64Encoded = Buffer.from(rawEmail, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ message: { raw: base64Encoded } }),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  return await res.json();
}
