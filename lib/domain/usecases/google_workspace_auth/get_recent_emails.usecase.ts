import type { EmailMessageSummary } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { refreshAndGetAccessToken } from "./refresh_and_get_access_token.usecase";

export async function getRecentEmails(userId: string): Promise<EmailMessageSummary[]> {
  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected || !status.emailEnabled) {
    return [];
  }

  try {
    const accessToken = await refreshAndGetAccessToken(userId);
    const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6";

    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listRes.ok) {
      console.error("Failed to fetch Gmail message list:", listRes.statusText);
      return [];
    }

    const listData = await listRes.json();
    const messages = Array.isArray(listData.messages) ? listData.messages : [];

    if (messages.length === 0) {
      return [];
    }

    const details = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        try {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`;
          const detailRes = await fetch(detailUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!detailRes.ok) return null;
          const detailData = await detailRes.json();

          const headers = Array.isArray(detailData.payload?.headers) ? detailData.payload.headers : [];
          const getHeader = (name: string) => headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

          return {
            id: detailData.id || msg.id,
            subject: getHeader("Subject") || "(No Subject)",
            from: getHeader("From") || "Unknown Sender",
            snippet: detailData.snippet || "",
            date: getHeader("Date") || "",
          };
        } catch (err) {
          return null;
        }
      })
    );

    return details.filter((item): item is EmailMessageSummary => item !== null);
  } catch (error) {
    console.error("Error in getRecentEmails:", error);
    return [];
  }
}
