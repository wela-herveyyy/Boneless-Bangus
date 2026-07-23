import { LuCalendar } from "react-icons/lu";

type EventCardProps = {
  event: {
    summary?: string;
    start?: string;
    end?: string;
    htmlLink?: string;
  };
};

export function EventCard({ event }: EventCardProps) {
  const { summary = "(No Title)", start, end, htmlLink } = event;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="my-2 flex flex-col gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-sm transition-colors hover:bg-surface-container-low">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LuCalendar className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="truncate font-semibold text-on-surface">{summary}</h4>
          <p className="truncate text-xs text-on-surface-muted">
            {formatDate(start)} {end ? `- ${formatDate(end)}` : ""}
          </p>
        </div>
      </div>
      {htmlLink && (
        <a
          href={htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-xs font-medium text-primary hover:underline"
        >
          View in Google Calendar &rarr;
        </a>
      )}
    </div>
  );
}
