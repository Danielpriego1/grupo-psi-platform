import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, startOfMonth, subMonths, endOfDay, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Clock, CheckCircle2 } from "lucide-react";
import { HeroRevenueCard } from "@/components/admin/dashboard/HeroRevenueCard";
import { KpiTile } from "@/components/admin/dashboard/KpiTile";
import { DonutStatus } from "@/components/admin/dashboard/DonutStatus";
import { BarMaintenance } from "@/components/admin/dashboard/BarMaintenance";
import { LiveActivityFeed } from "@/components/admin/dashboard/LiveActivityFeed";
import { CompactCalendar } from "@/components/admin/dashboard/CompactCalendar";
import { PendingOrdersMap, type MapPin } from "@/components/admin/dashboard/PendingOrdersMap";
import { RecentOrdersTable, type OrderRow } from "@/components/admin/dashboard/RecentOrdersTable";
import type { MonthlyPoint, StatusSlice } from "@/components/admin/dashboard/DashboardCharts";
import type { CalendarEvent } from "@/components/admin/dashboard/AppointmentsCalendar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { checkLeafletCompatibility } from "@/lib/leafletCompat";
import { LeafletCompatAlert } from "@/components/admin/LeafletCompatAlert";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

const COMPLETED_STATUSES = ["ready", "delivered"] as const;
const REVENUE_STATUSES: readonly string[] = ["confirmed", "in_progress", "ready", "delivered"];

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_progress: "En proceso",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const MAINT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  scheduled: "Agendado",
  contacted: "Contactado",
  completed: "Completado",
  cancelled: "Cancelado",
};

interface Kpi {
  ordersToday: number;
  pendingOrders: number;
  completedThisMonth: number;
  monthRevenue: number;
  revenueChange?: number;
  completedChange?: number;
}

export default function AdminDashboard() {
  const [kpi, setKpi] = useState<Kpi>({
    ordersToday: 0,
    pendingOrders: 0,
    completedThisMonth: 0,
    monthRevenue: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<StatusSlice[]>([]);
  const [maintByStatus, setMaintByStatus] = useState<StatusSlice[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [recent, setRecent] = useState<OrderRow[]>([]);
  const [pulseTick, setPulseTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const mountedRef = useRef(false);

  const fetchAll = useCallback(async () => {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const monthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));

    const [
      ordersAllRes,
      ordersTodayRes,
      pendingOrdersRes,
      completedMonthRes,
      pendingOrdersGeoRes,
      maintAllRes,
      maintPendingGeoRes,
      maintScheduledRes,
      deliveriesScheduledRes,
      recentRes,
    ] = await Promise.all([
      supabase.from("orders").select("total, status, created_at"),
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart).lte("created_at", todayEnd),
      supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed"] as const),
      supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["ready", "delivered"] as const).gte("created_at", monthStart.toISOString()),
      supabase
        .from("orders")
        .select("id, order_number, latitude, longitude, address, clients(company_name)")
        .in("status", ["pending", "confirmed", "in_progress", "ready"] as const)
        .not("latitude", "is", null)
        .not("longitude", "is", null),
      supabase.from("maintenance_requests").select("status"),
      supabase
        .from("maintenance_requests")
        .select("id, tracking_code, contact_name, latitude, longitude, address")
        .in("status", ["pending", "scheduled"] as const)
        .not("latitude", "is", null)
        .not("longitude", "is", null),
      supabase
        .from("maintenance_requests")
        .select("id, tracking_code, contact_name, scheduled_date, time_slot")
        .not("scheduled_date", "is", null),
      supabase.from("deliveries").select("id, scheduled_date, delivery_address, orders:order_id(order_number)").not("scheduled_date", "is", null),
      supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, clients(company_name)")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const allOrders = ordersAllRes.data ?? [];

    const monthRevenue = allOrders
      .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.created_at) >= monthStart)
      .reduce((s, o) => s + Number(o.total), 0);

    const prevMonthRevenue = allOrders
      .filter(
        (o) =>
          REVENUE_STATUSES.includes(o.status) &&
          new Date(o.created_at) >= prevMonthStart &&
          new Date(o.created_at) < monthStart,
      )
      .reduce((s, o) => s + Number(o.total), 0);

    const prevMonthCompleted = allOrders.filter(
      (o) =>
        COMPLETED_STATUSES.includes(o.status as (typeof COMPLETED_STATUSES)[number]) &&
        new Date(o.created_at) >= prevMonthStart &&
        new Date(o.created_at) < monthStart,
    ).length;

    const pct = (curr: number, prev: number) =>
      prev === 0 ? (curr === 0 ? 0 : 100) : ((curr - prev) / prev) * 100;

    setKpi({
      ordersToday: ordersTodayRes.count ?? 0,
      pendingOrders: pendingOrdersRes.count ?? 0,
      completedThisMonth: completedMonthRes.count ?? 0,
      monthRevenue,
      revenueChange: pct(monthRevenue, prevMonthRevenue),
      completedChange: pct(completedMonthRes.count ?? 0, prevMonthCompleted),
    });

    const buckets: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      buckets.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: es }), total: 0 });
    }
    allOrders.forEach((o) => {
      if (!REVENUE_STATUSES.includes(o.status)) return;
      const k = format(new Date(o.created_at), "yyyy-MM");
      const b = buckets.find((x) => x.key === k);
      if (b) b.total += Number(o.total);
    });
    setMonthly(buckets.map((b) => ({ month: b.label, ventas: Math.round(b.total) })));

    const orderCounts: Record<string, number> = {};
    allOrders.forEach((o) => {
      orderCounts[o.status] = (orderCounts[o.status] ?? 0) + 1;
    });
    setOrdersByStatus(
      Object.entries(orderCounts).map(([k, v]) => ({ name: ORDER_STATUS_LABEL[k] ?? k, value: v })),
    );

    const maintCounts: Record<string, number> = {};
    (maintAllRes.data ?? []).forEach((m: any) => {
      maintCounts[m.status] = (maintCounts[m.status] ?? 0) + 1;
    });
    setMaintByStatus(
      Object.entries(maintCounts).map(([k, v]) => ({ name: MAINT_STATUS_LABEL[k] ?? k, value: v })),
    );

    const orderPins: MapPin[] = (pendingOrdersGeoRes.data ?? []).map((o: any) => ({
      id: o.id,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      label: o.order_number,
      sublabel: o.clients?.company_name ?? o.address ?? "",
      type: "order",
    }));
    const maintPins: MapPin[] = (maintPendingGeoRes.data ?? []).map((m: any) => ({
      id: m.id,
      lat: Number(m.latitude),
      lng: Number(m.longitude),
      label: m.tracking_code ?? m.contact_name,
      sublabel: m.address ?? m.contact_name,
      type: "maintenance",
    }));
    setPins([...orderPins, ...maintPins]);

    const maintEvents: CalendarEvent[] = (maintScheduledRes.data ?? []).map((m: any) => {
      const start = new Date(`${m.scheduled_date}T09:00:00`);
      return {
        title: `🔧 ${m.tracking_code ?? m.contact_name} ${m.time_slot ? `(${m.time_slot})` : ""}`,
        start,
        end: addHours(start, 2),
        type: "maintenance",
      };
    });
    const deliveryEvents: CalendarEvent[] = (deliveriesScheduledRes.data ?? []).map((d: any) => {
      const start = new Date(`${d.scheduled_date}T11:00:00`);
      return {
        title: `🚚 ${d.orders?.order_number ?? "Entrega"}`,
        start,
        end: addHours(start, 1),
        type: "delivery",
      };
    });
    setEvents([...maintEvents, ...deliveryEvents]);

    setRecent((recentRes.data ?? []) as OrderRow[]);
    setLastUpdated(new Date());

    if (mountedRef.current) {
      setPulseTick((x) => x + 1);
    } else {
      mountedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useRealtimeTable({ table: "orders", onChange: fetchAll });
  useRealtimeTable({ table: "maintenance_requests", onChange: fetchAll });
  useRealtimeTable({ table: "deliveries", onChange: fetchAll });
  useRealtimeTable({ table: "appointments", onChange: fetchAll });

  const compat = checkLeafletCompatibility();
  const lastUpdatedLabel = format(lastUpdated, "HH:mm:ss");

  return (
    <div
      className="-m-5 lg:-m-8 p-5 lg:p-8 bg-slate-50 min-h-[calc(100vh-3.5rem)]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-3xl font-bold tracking-tight text-slate-900"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Panel de control
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              En vivo
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1.5">
            Sincronizado a las <span className="tabular-nums font-medium text-slate-700">{lastUpdatedLabel}</span>
          </p>
        </div>
      </div>

      {/* Top row: Hero + 3 KPIs + Feed (1x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <div className="lg:col-span-2 lg:row-span-1">
          <HeroRevenueCard
            amount={kpi.monthRevenue}
            change={kpi.revenueChange}
            monthly={monthly}
            pulseKey={pulseTick}
          />
        </div>
        <KpiTile
          label="Pedidos hoy"
          value={kpi.ordersToday}
          icon={Package}
          tone="amber"
          sublabel="Últimas 24h"
          pulseKey={pulseTick}
        />
        <div className="md:col-span-1 lg:row-span-2">
          <LiveActivityFeed />
        </div>
      </div>

      {/* Second row: Map (2x2) + 2 KPIs stacked + (feed continues from above) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <div className="lg:col-span-2 lg:row-span-2">
          {compat.compatible ? (
            <ErrorBoundary label="el mapa de pedidos y mantenimientos">
              <PendingOrdersMap pins={pins} />
            </ErrorBoundary>
          ) : (
            <LeafletCompatAlert compat={compat} />
          )}
        </div>
        <KpiTile
          label="Pendientes"
          value={kpi.pendingOrders}
          icon={Clock}
          tone="rose"
          sublabel="Requieren acción"
          pulseKey={pulseTick}
        />
        <KpiTile
          label="Completados mes"
          value={kpi.completedThisMonth}
          icon={CheckCircle2}
          tone="emerald"
          sublabel={
            kpi.completedChange !== undefined && !Number.isNaN(kpi.completedChange)
              ? `${kpi.completedChange >= 0 ? "+" : ""}${kpi.completedChange.toFixed(1)}% vs mes ant.`
              : undefined
          }
          pulseKey={pulseTick}
        />
        <DonutStatus title="Pedidos por estado" data={ordersByStatus} pulseKey={pulseTick} />
        <BarMaintenance title="Mantenimientos" data={maintByStatus} pulseKey={pulseTick} />
      </div>

      {/* Third row: Calendar + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <CompactCalendar events={events} />
        </div>
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={recent} onChanged={fetchAll} />
        </div>
      </div>
    </div>
  );
}
