import type { GenerateEmailInput } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { refreshAndGetAccessToken } from "./refresh_and_get_access_token.usecase";

export async function executeEmailAction(
  userId: string,
  input: GenerateEmailInput
): Promise<{ id: string; threadId: string }> {
  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected) {
    throw new Error("Google Workspace account is not connected.");
  }
  if (!status.emailEnabled) {
    throw new Error("Gmail send integration is disabled in Workspace Sidebar settings.");
  }

  const accessToken = await refreshAndGetAccessToken(userId);

  const headers = [
    `To: ${input.to}`,
    input.cc ? `Cc: ${input.cc}` : "",
    input.bcc ? `Bcc: ${input.bcc}` : "",
    `Subject: =?utf-8?B?${Buffer.from(input.subject).toString("base64")}?=`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
  ]
    .filter(Boolean)
    .join("\r\n");

  const mimeMessage = `${headers}\r\n\r\n${input.body}`;
  const rawBase64Url = Buffer.from(mimeMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Gmail API error: ${data.error?.message || data.error_description || "Unknown email sending error"}`
    );
  }

  return {
    id: data.id,
    threadId: data.threadId,
  };
}
