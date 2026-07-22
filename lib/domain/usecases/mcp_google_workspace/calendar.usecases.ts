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

export async function listCalendarEventsUseCase(
  token: string,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 10,
  pageToken?: string
) {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    singleEvents: "true",
    orderBy: "startTime",
  });
  
  // Default to now if timeMin is not provided so we don't fetch historical events
  params.append("timeMin", timeMin || new Date().toISOString());
  if (timeMax) params.append("timeMax", timeMax);
  if (pageToken) params.append("pageToken", pageToken);

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(token),
  });
  
  if (!res.ok) throw new Error(`Calendar API error: ${await res.text()}`);
  return await res.json();
}

export async function updateCalendarEventUseCase(
  token: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
  }
) {
  // First fetch the event to get its current state (required for partial updates with this endpoint)
  const getRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    headers: getHeaders(token),
  });
  if (!getRes.ok) throw new Error(`Calendar API error: ${await getRes.text()}`);
  const event = await getRes.json();

  if (updates.summary) event.summary = updates.summary;
  if (updates.description !== undefined) event.description = updates.description;
  if (updates.start) event.start = { dateTime: updates.start };
  if (updates.end) event.end = { dateTime: updates.end };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(event),
  });
  
  if (!res.ok) throw new Error(`Calendar API error: ${await res.text()}`);
  return await res.json();
}

export async function deleteCalendarEventUseCase(token: string, eventId: string) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  
  if (!res.ok) throw new Error(`Calendar API error: ${await res.text()}`);
  return { success: true };
}

