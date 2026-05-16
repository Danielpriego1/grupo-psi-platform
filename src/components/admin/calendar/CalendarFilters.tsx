import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarFilters, CalendarSource } from "@/hooks/useCalendarEvents";
import { SOURCE_META } from "@/hooks/useCalendarEvents";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SOURCES: CalendarSource[] = ["appointment", "maintenance", "delivery", "order"];
const STATUSES = [
  "scheduled", "confirmed", "pending", "in_progress",
  "completed", "ready", "delivered", "cancelled", "no_show", "assigned", "in_transit", "failed",
];

interface Props {
  filters: CalendarFilters;
  setFilters: (f: CalendarFilters) => void;
}

export function CalendarFilters({ filters, setFilters }: Props) {
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [techs, setTechs] = useState<{ user_id: string; full_name: string | null }[]>([]);

  useEffect(() => {
    supabase.from("clients").select("id, company_name").order("company_name").then(({ data }) => {
      if (data) setClients(data);
    });
    supabase.from("profiles").select("user_id, full_name").then(({ data }) => {
      if (data) setTechs(data);
    });
  }, []);

  const toggleSet = <T extends string>(set: Set<T>, val: T): Set<T> => {
    const n = new Set(set);
    n.has(val) ? n.delete(val) : n.add(val);
    return n;
  };

  const activeCount =
    filters.sources.size + filters.statuses.size +
    (filters.clientId ? 1 : 0) + (filters.assignedTo ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tipo */}
      <div className="flex flex-wrap gap-1">
        {SOURCES.map((s) => {
          const active = filters.sources.has(s);
          const meta = SOURCE_META[s];
          return (
            <button
              key={s}
              onClick={() => setFilters({ ...filters, sources: toggleSet(filters.sources, s) })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Estado */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            Estado {filters.statuses.size > 0 && `(${filters.statuses.size})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1">
          <div className="max-h-64 overflow-auto">
            {STATUSES.map((s) => {
              const active = filters.statuses.has(s);
              return (
                <button
                  key={s}
                  onClick={() => setFilters({ ...filters, statuses: toggleSet(filters.statuses, s) })}
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-muted"
                >
                  <span className="capitalize">{s.replace("_", " ")}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Cliente */}
      <select
        value={filters.clientId ?? ""}
        onChange={(e) => setFilters({ ...filters, clientId: e.target.value || null })}
        className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground"
      >
        <option value="">Todos los clientes</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.company_name}</option>
        ))}
      </select>

      {/* Técnico */}
      <select
        value={filters.assignedTo ?? ""}
        onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value || null })}
        className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground"
      >
        <option value="">Todos los responsables</option>
        {techs.map((t) => (
          <option key={t.user_id} value={t.user_id}>{t.full_name || t.user_id.slice(0, 8)}</option>
        ))}
      </select>

      {activeCount > 0 && (
        <Button
          variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
          onClick={() => setFilters({ sources: new Set(), statuses: new Set(), clientId: null, assignedTo: null })}
        >
          Limpiar
        </Button>
      )}
    </div>
  );
}
