import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { EventPill } from "./EventPill";

interface Props {
  cursor: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectDate: (d: Date) => void;
}

export function MonthView({ cursor, events, onSelectEvent, onSelectDate }: Props) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  const byDay = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = format(new Date(ev.start_at), "yyyy-MM-dd");
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(ev);
  }

  const weekDays = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((d) => (
          <div key={d} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" role="grid">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDay.get(key) ?? [];
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, cursor);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;
          return (
            <div
              key={key}
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[110px] border-b border-r border-border/60 p-1.5 transition-colors hover:bg-muted/30 cursor-pointer",
                (i + 1) % 7 === 0 && "border-r-0",
                i >= days.length - 7 && "border-b-0",
                !inMonth && "bg-muted/10"
              )}
            >
              <div className="mb-1 flex items-center gap-1">
                <span className={cn(
                  "text-xs tabular-nums",
                  inMonth ? "text-foreground" : "text-muted-foreground/50",
                  isToday && "font-semibold text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {isToday && <span className="h-1 w-1 rounded-full bg-primary" />}
              </div>
              <div className="space-y-0.5">
                {visible.map((ev) => (
                  <EventPill key={ev.id + ev.source} event={ev} onClick={() => onSelectEvent(ev)} compact />
                ))}
                {overflow > 0 && (
                  <div className="px-1.5 text-[10px] text-muted-foreground">+{overflow} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
