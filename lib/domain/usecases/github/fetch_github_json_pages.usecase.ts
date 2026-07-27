import "server-only";

/** Fetch all pages up to `maxPages` (100 items/page). */
export async function fetchGithubJsonPages<T>(
  url: string,
  headers: HeadersInit,
  maxPages = 3,
): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;

  for (let page = 0; page < maxPages && nextUrl; page++) {
    const res: Response = await fetch(nextUrl, { headers, cache: "no-store" });
    if (!res.ok) {
      const body: string = await res.text().catch(() => "");
      throw new Error(
        `GitHub API ${res.status}: ${body.slice(0, 200) || res.statusText}`,
      );
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : "Unexpected GitHub response.";
      throw new Error(message);
    }
    items.push(...(data as T[]));

    const link: string | null = res.headers.get("link");
    const match: RegExpMatchArray | null =
      link?.match(/<([^>]+)>;\s*rel="next"/) ?? null;
    nextUrl = match?.[1] ?? null;
  }

  return items;
}
