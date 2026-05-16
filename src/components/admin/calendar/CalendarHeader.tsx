import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarView = "day" | "week" | "month";

interface Props {
  cursor: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarView) => void;
  onNew: () => void;
  canCreate: boolean;
}

const VIEWS: { v: CalendarView; label: string }[] = [
  { v: "day", label: "Día" },
  { v: "week", label: "Semana" },
  { v: "month", label: "Mes" },
];

export function CalendarHeader({
  cursor, view, onPrev, onNext, onToday, onViewChange, onNew, canCreate,
}: Props) {
  const label =
    view === "month"
      ? format(cursor, "LLLL yyyy", { locale: es })
      : view === "week"
      ? `Semana de ${format(cursor, "d 'de' LLLL", { locale: es })}`
      : format(cursor, "EEEE d 'de' LLLL yyyy", { locale: es });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday} className="h-8">
          Hoy
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="ml-1 text-sm font-medium capitalize text-foreground sm:text-base">
          {label}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.v}
              onClick={() => onViewChange(v.v)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
                view === v.v
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        {canCreate && (
          <Button size="sm" onClick={onNew} className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" />
            Nueva cita
          </Button>
        )}
      </div>
    </div>
  );
}
