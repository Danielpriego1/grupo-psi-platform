import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./AppointmentsCalendar";

export function CompactCalendar({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayEvents = (d: Date) => events.filter((e) => isSameDay(e.start, d));
  const selectedEvents = dayEvents(selected).sort((a, b) => +a.start - +b.start);

  return (
    <BentoCard className="flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4
            className="font-bold text-slate-900 text-base capitalize"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {format(cursor, "MMMM yyyy", { locale: es })}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Mantenimientos y entregas</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCursor(new Date());
              setSelected(new Date());
            }}
            className="px-2.5 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition"
          >
            Hoy
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-300"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const isToday = isSameDay(d, new Date());
          const isSel = isSameDay(d, selected);
          const evs = dayEvents(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={cn(
                "relative aspect-square rounded-xl text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5",
                !inMonth && "text-slate-300",
                inMonth && !isSel && !isToday && "text-slate-700 hover:bg-slate-50",
                isToday && !isSel && "bg-indigo-50 text-indigo-700 font-semibold",
                isSel && "bg-indigo-600 text-white shadow-md shadow-indigo-200",
              )}
            >
              <span>{format(d, "d")}</span>
              {evs.length > 0 && (
                <div className="flex gap-0.5">
                  {evs.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSel
                          ? "bg-white"
                          : e.type === "maintenance"
                          ? "bg-amber-500"
                          : "bg-sky-500",
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex-1 min-h-[80px]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          {format(selected, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="text-xs text-slate-400">Sin eventos programados</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.slice(0, 3).map((e, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl text-xs",
                  e.type === "maintenance" ? "bg-amber-50" : "bg-sky-50",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-6 rounded-full",
                    e.type === "maintenance" ? "bg-amber-500" : "bg-sky-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{e.title}</p>
                  <p className="text-[10px] text-slate-500">{format(e.start, "HH:mm")}</p>
                </div>
              </div>
            ))}
            {selectedEvents.length > 3 && (
              <p className="text-[10px] text-slate-400 pl-3">
                +{selectedEvents.length - 3} más
              </p>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
