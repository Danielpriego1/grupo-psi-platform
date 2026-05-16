import { SOURCE_META, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  event: CalendarEvent;
  onClick: () => void;
  compact?: boolean;
}

export function EventPill({ event, onClick, compact }: Props) {
  const meta = SOURCE_META[event.source];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "group flex w-full items-center gap-1.5 overflow-hidden rounded-sm bg-muted/50 px-1.5 text-left text-[11px] leading-tight text-foreground transition-colors hover:bg-muted",
        compact ? "h-5" : "h-6"
      )}
      title={event.title}
    >
      <span className={cn("h-full w-[2px] shrink-0 rounded-full", meta.barClass)} />
      {!compact && (
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {format(new Date(event.start_at), "HH:mm")}
        </span>
      )}
      <span className="truncate font-medium">{event.title}</span>
    </button>
  );
}
