import type { EmailMessageSummary } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { refreshAndGetAccessToken } from "./refresh_and_get_access_token.usecase";

export async function getRecentEmails(userId: string, query?: string): Promise<EmailMessageSummary[]> {
  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected || !status.emailEnabled) {
    return [];
  }

  try {
    const accessToken = await refreshAndGetAccessToken(userId);

    // Try fetching from inbox first, or use the provided query
    let baseQ = query ? query : "in:inbox";
    let listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=${encodeURIComponent(baseQ)}`;
    let listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listRes.ok) {
      if (listRes.status === 403 || listRes.status === 401) {
        throw new Error("Gmail Read permission missing (403/401). Please click Disconnect and Connect again to grant read access.");
      }
      const errText = await listRes.text();
      console.error("Failed to fetch Gmail message list:", listRes.status, listRes.statusText, errText);
      return [];
    }

    let listData = await listRes.json();
    let messages = Array.isArray(listData.messages) ? listData.messages : [];

    // Fallback: if query returns 0 messages and no explicit query was provided, query all messages
    if (messages.length === 0 && !query) {
      listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8";
      listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (listRes.ok) {
        listData = await listRes.json();
        messages = Array.isArray(listData.messages) ? listData.messages : [];
      }
    }

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
    // If it's a permission/scope error, re-throw so the UI displays clear instruction to the user
    if (error instanceof Error && (error.message.includes("403") || error.message.includes("401") || error.message.includes("permission"))) {
      throw error;
    }
    return [];
  }
}
