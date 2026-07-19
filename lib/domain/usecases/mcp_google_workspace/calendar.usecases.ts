function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createCalendarEventUseCase(
  token: string,
  summary: string,
  description: string,
  start: string,
  end: string,
  addGoogleMeet?: boolean
) {
  const url = addGoogleMeet
    ? "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1"
    : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  const bodyPayload = {
    summary,
    description: description || "",
    start: { dateTime: start },
    end: { dateTime: end },
    ...(addGoogleMeet ? {
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(bodyPayload),
  });
  if (!res.ok) throw new Error(`Calendar API error: ${await res.text()}`);
  return await res.json();
}
