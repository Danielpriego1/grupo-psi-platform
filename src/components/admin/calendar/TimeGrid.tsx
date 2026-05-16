import { startOfWeek, addDays, isSameDay, format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { SOURCE_META } from "@/hooks/useCalendarEvents";

interface Props {
  cursor: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
  mode: "week" | "day";
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am-8pm
const ROW_H = 48; // px per hour

export function TimeGrid({ cursor, events, onSelectEvent, mode }: Props) {
  const days = mode === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor, { weekStartsOn: 1 }), i))
    : [cursor];
  const today = new Date();

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      <div className="flex min-w-fit">
        {/* hour gutter */}
        <div className="w-14 shrink-0 border-r border-border">
          <div className="h-10 border-b border-border" />
          {HOURS.map((h) => (
            <div key={h} style={{ height: ROW_H }} className="flex items-start justify-end px-2 pt-1 text-[10px] text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="relative flex-1 min-w-[140px] border-r border-border/60 last:border-r-0">
              <div className={cn(
                "sticky top-0 z-10 flex h-10 flex-col items-center justify-center border-b border-border bg-card text-xs",
                isToday && "text-primary"
              )}>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE", { locale: es })}
                </span>
                <span className={cn("font-semibold tabular-nums", isToday && "text-primary")}>
                  {format(day, "d")}
                </span>
              </div>

              <div className="relative" style={{ height: HOURS.length * ROW_H }}>
                {HOURS.map((h, i) => (
                  <div key={h} style={{ top: i * ROW_H, height: ROW_H }} className="absolute inset-x-0 border-b border-border/40" />
                ))}

                {dayEvents.map((ev) => {
                  const start = new Date(ev.start_at);
                  const end = new Date(ev.end_at);
                  const startMins = start.getHours() * 60 + start.getMinutes() - HOURS[0] * 60;
                  const dur = Math.max(20, differenceInMinutes(end, start));
                  if (startMins < 0 || startMins > HOURS.length * 60) return null;
                  const meta = SOURCE_META[ev.source];
                  return (
                    <button
                      key={ev.id + ev.source}
                      onClick={() => onSelectEvent(ev)}
                      style={{ top: (startMins / 60) * ROW_H + 1, height: (dur / 60) * ROW_H - 2 }}
                      className="absolute inset-x-1 flex items-start gap-1 overflow-hidden rounded-sm bg-muted/60 px-1.5 py-1 text-left text-[11px] text-foreground hover:bg-muted"
                    >
                      <span className={cn("h-full w-[2px] shrink-0 rounded-full", meta.barClass)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{ev.title}</div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {format(start, "HH:mm")}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
