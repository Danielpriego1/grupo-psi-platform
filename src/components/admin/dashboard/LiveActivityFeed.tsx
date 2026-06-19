import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { formatRelative } from "@/hooks/useRelativeTime";
import { BentoCard } from "./BentoCard";
import { Package, CreditCard, Wrench, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "order" | "payment" | "maintenance" | "delivery";

interface FeedItem {
  id: string;
  kind: Kind;
  title: string;
  subtitle: string;
  at: string;
}

const kindStyles: Record<Kind, { dot: string; tint: string; Icon: typeof Package; label: string }> = {
  order: { dot: "bg-indigo-500", tint: "bg-indigo-50 text-indigo-600", Icon: Package, label: "Pedido" },
  payment: { dot: "bg-emerald-500", tint: "bg-emerald-50 text-emerald-600", Icon: CreditCard, label: "Pago" },
  maintenance: { dot: "bg-amber-500", tint: "bg-amber-50 text-amber-600", Icon: Wrench, label: "Mtto." },
  delivery: { dot: "bg-sky-500", tint: "bg-sky-50 text-sky-600", Icon: Truck, label: "Entrega" },
};

const fmtMoney = (n: number) => `$${Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

export function LiveActivityFeed({ onTick }: { onTick?: () => void }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [, force] = useState(0);

  const refresh = useCallback(async () => {
    const [ordersR, maintR, delivR] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, total, status, payment_status, created_at, clients(company_name)")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("maintenance_requests")
        .select("id, tracking_code, contact_name, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("deliveries")
        .select("id, scheduled_date, created_at, orders:order_id(order_number)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const merged: FeedItem[] = [];

    (ordersR.data ?? []).forEach((o: any) => {
      merged.push({
        id: `o-${o.id}`,
        kind: "order",
        title: `Pedido ${o.order_number ?? ""}`,
        subtitle: o.clients?.company_name ?? "Cliente",
        at: o.created_at,
      });
      if (o.payment_status === "paid") {
        merged.push({
          id: `p-${o.id}`,
          kind: "payment",
          title: `Pago confirmado · ${fmtMoney(Number(o.total))}`,
          subtitle: o.order_number ?? "",
          at: o.created_at,
        });
      }
    });
    (maintR.data ?? []).forEach((m: any) => {
      merged.push({
        id: `m-${m.id}`,
        kind: "maintenance",
        title: `Mantenimiento ${m.tracking_code ?? ""}`,
        subtitle: m.contact_name ?? "Solicitud",
        at: m.created_at,
      });
    });
    (delivR.data ?? []).forEach((d: any) => {
      merged.push({
        id: `d-${d.id}`,
        kind: "delivery",
        title: `Entrega ${d.orders?.order_number ?? ""}`,
        subtitle: d.scheduled_date ? `Programada ${d.scheduled_date}` : "Programada",
        at: d.created_at,
      });
    });

    merged.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    setItems(merged.slice(0, 20));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleChange = useCallback(() => {
    refresh();
    onTick?.();
  }, [refresh, onTick]);

  useRealtimeTable({ table: "orders", onChange: handleChange });
  useRealtimeTable({ table: "maintenance_requests", onChange: handleChange });
  useRealtimeTable({ table: "deliveries", onChange: handleChange });

  return (
    <BentoCard className="flex flex-col min-h-[560px]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h4
            className="font-bold text-slate-900 text-base"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Actividad en vivo
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Últimos eventos del sistema</p>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Sin eventos recientes</p>
        )}
        {items.map((it, i) => {
          const s = kindStyles[it.kind];
          const Icon = s.Icon;
          return (
            <div
              key={it.id}
              className={cn(
                "flex gap-3 group",
                i === 0 && "animate-fade-in",
              )}
            >
              <div
                className={cn(
                  "shrink-0 mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center",
                  s.tint,
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{it.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{it.subtitle}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
                  {formatRelative(it.at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}
