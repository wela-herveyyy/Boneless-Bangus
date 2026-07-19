function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function searchGmailThreadsUseCase(token: string, query: string) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=10`,
    { headers: getHeaders(token) }
  );
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  return await res.json();
}

export async function getGmailThreadUseCase(token: string, id: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(id)}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  return await res.json();
}

export async function getGmailMessageUseCase(token: string, id: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
  return await res.json();
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
