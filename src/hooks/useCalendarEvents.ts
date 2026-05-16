import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "./useRealtimeTable";

export type CalendarSource = "appointment" | "maintenance" | "delivery" | "order";

export interface CalendarEvent {
  id: string;
  source: CalendarSource;
  source_id: string;
  title: string;
  event_type: string;
  status: string;
  start_at: string;
  end_at: string;
  client_name: string | null;
  client_id: string | null;
  address: string | null;
  state: string | null;
  municipality: string | null;
  latitude: number | null;
  longitude: number | null;
  assigned_to: string | null;
  contact_phone: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
}

export interface CalendarFilters {
  sources: Set<CalendarSource>;
  statuses: Set<string>;
  clientId: string | null;
  assignedTo: string | null;
}

export function useCalendarEvents(rangeStart: Date, rangeEnd: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("calendar_events" as any)
      .select("*")
      .gte("start_at", rangeStart.toISOString())
      .lt("start_at", rangeEnd.toISOString())
      .order("start_at", { ascending: true });
    if (!error && data) setEvents(data as unknown as CalendarEvent[]);
    setLoading(false);
  }, [rangeStart.getTime(), rangeEnd.getTime()]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime: cualquier cambio en las 4 tablas operativas refresca la vista
  useRealtimeTable({ table: "appointments", onChange: fetchEvents });
  useRealtimeTable({ table: "maintenance_requests", onChange: fetchEvents });
  useRealtimeTable({ table: "deliveries", onChange: fetchEvents });
  useRealtimeTable({ table: "orders", onChange: fetchEvents });

  return { events, loading, refetch: fetchEvents };
}

export function applyFilters(events: CalendarEvent[], f: CalendarFilters) {
  return events.filter((e) => {
    if (f.sources.size > 0 && !f.sources.has(e.source)) return false;
    if (f.statuses.size > 0 && !f.statuses.has(e.status)) return false;
    if (f.clientId && e.client_id !== f.clientId) return false;
    if (f.assignedTo && e.assigned_to !== f.assignedTo) return false;
    return true;
  });
}

export const SOURCE_META: Record<
  CalendarSource,
  { label: string; barClass: string; dotClass: string }
> = {
  appointment: { label: "Cita", barClass: "bg-slate-400", dotClass: "bg-slate-400" },
  maintenance: { label: "Mantenimiento", barClass: "bg-amber-500", dotClass: "bg-amber-500" },
  delivery: { label: "Entrega", barClass: "bg-sky-500", dotClass: "bg-sky-500" },
  order: { label: "Pedido", barClass: "bg-emerald-500", dotClass: "bg-emerald-500" },
};
