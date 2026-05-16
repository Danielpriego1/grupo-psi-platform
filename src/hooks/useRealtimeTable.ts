import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Options {
  table: string;
  event?: Event;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onChange: (payload: any) => void;
}

/**
 * Suscripción genérica a postgres_changes de Supabase Realtime.
 * Dispara onChange ante cualquier INSERT/UPDATE/DELETE de la tabla indicada
 * y limpia la suscripción al desmontar.
 */
export function useRealtimeTable({
  table,
  event = "*",
  schema = "public",
  filter,
  enabled = true,
  onChange,
}: Options) {
  useEffect(() => {
    if (!enabled) return;
    const channelName = `rt-${table}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        { event, schema, table, ...(filter ? { filter } : {}) },
        (payload) => onChange(payload)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event, schema, filter, enabled]);
}
