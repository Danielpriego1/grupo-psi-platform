import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, startOfMonth, subMonths, endOfDay, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { KpiCards, type KpiData } from "@/components/admin/dashboard/KpiCards";
import { DashboardCharts, type MonthlyPoint, type StatusSlice } from "@/components/admin/dashboard/DashboardCharts";
import { PendingOrdersMap, type MapPin } from "@/components/admin/dashboard/PendingOrdersMap";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { checkLeafletCompatibility } from "@/lib/leafletCompat";
import { AppointmentsCalendar, type CalendarEvent } from "@/components/admin/dashboard/AppointmentsCalendar";
import { RecentOrdersTable, type OrderRow } from "@/components/admin/dashboard/RecentOrdersTable";

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

export default function AdminDashboard() {
  const [kpi, setKpi] = useState<KpiData>({
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

  const fetchAll = useCallback(async () => {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const monthStart = startOfMonth(now);

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
        .limit(8),
    ]);

    const allOrders = ordersAllRes.data ?? [];

    // Monthly revenue (current month)
    const monthRevenue = allOrders
      .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.created_at) >= monthStart)
      .reduce((s, o) => s + Number(o.total), 0);

    setKpi({
      ordersToday: ordersTodayRes.count ?? 0,
      pendingOrders: pendingOrdersRes.count ?? 0,
      completedThisMonth: completedMonthRes.count ?? 0,
      monthRevenue,
    });

    // Last 6 months revenue
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

    // Orders by status
    const orderCounts: Record<string, number> = {};
    allOrders.forEach((o) => {
      orderCounts[o.status] = (orderCounts[o.status] ?? 0) + 1;
    });
    setOrdersByStatus(
      Object.entries(orderCounts).map(([k, v]) => ({ name: ORDER_STATUS_LABEL[k] ?? k, value: v })),
    );

    // Maintenance by status
    const maintCounts: Record<string, number> = {};
    (maintAllRes.data ?? []).forEach((m: any) => {
      maintCounts[m.status] = (maintCounts[m.status] ?? 0) + 1;
    });
    setMaintByStatus(
      Object.entries(maintCounts).map(([k, v]) => ({ name: MAINT_STATUS_LABEL[k] ?? k, value: v })),
    );

    // Map pins
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

    // Calendar events
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
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <KpiCards data={kpi} />
      <DashboardCharts monthly={monthly} ordersByStatus={ordersByStatus} maintByStatus={maintByStatus} />
      {(() => {
        const compat = checkLeafletCompatibility();
        if (!compat.compatible) {
          return (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
            >
              <p className="font-medium text-foreground">
                Mapa deshabilitado por incompatibilidad de versiones.
              </p>
              <p className="text-xs text-muted-foreground mt-1">{compat.message}</p>
            </div>
          );
        }
        return (
          <ErrorBoundary label="el mapa de pedidos y mantenimientos">
            <PendingOrdersMap pins={pins} />
          </ErrorBoundary>
        );
      })()}
      <AppointmentsCalendar events={events} />
      <RecentOrdersTable orders={recent} onChanged={fetchAll} />
    </div>
  );
}
