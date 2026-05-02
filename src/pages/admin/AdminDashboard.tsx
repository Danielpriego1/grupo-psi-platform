import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck, Package, Users, AlertTriangle, TrendingUp, DollarSign, Wrench } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  activeDeliveries: number;
  totalClients: number;
  lowStockItems: number;
  totalInventoryValue: number;
  totalRevenue: number;
  monthRevenue: number;
  pendingMaintenance: number;
}

const REVENUE_STATUSES = ["confirmed", "in_progress", "ready", "delivered"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
    totalClients: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    pendingMaintenance: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; ventas: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [ordersAll, pendingOrders, deliveries, clients, inventory, allOrdersData, maint] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed"]),
        supabase.from("deliveries").select("id", { count: "exact", head: true }).in("status", ["assigned", "in_transit"]),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("inventory").select("stock, min_stock, unit_price"),
        supabase.from("orders").select("total, status, created_at"),
        supabase.from("maintenance_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const inv = inventory.data ?? [];
      const lowStock = inv.filter((i) => i.stock <= i.min_stock).length;
      const totalValue = inv.reduce((sum, i) => sum + i.stock * Number(i.unit_price), 0);

      const allOrders = allOrdersData.data ?? [];
      const totalRevenue = allOrders
        .filter((o) => REVENUE_STATUSES.includes(o.status))
        .reduce((s, o) => s + Number(o.total), 0);

      const monthStart = startOfMonth(new Date());
      const monthRevenue = allOrders
        .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.created_at) >= monthStart)
        .reduce((s, o) => s + Number(o.total), 0);

      // Last 6 months
      const buckets: { key: string; label: string; total: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        buckets.push({
          key: format(d, "yyyy-MM"),
          label: format(d, "MMM", { locale: es }),
          total: 0,
        });
      }
      allOrders.forEach((o) => {
        if (!REVENUE_STATUSES.includes(o.status)) return;
        const k = format(new Date(o.created_at), "yyyy-MM");
        const b = buckets.find((x) => x.key === k);
        if (b) b.total += Number(o.total);
      });

      setMonthlyData(buckets.map((b) => ({ month: b.label, ventas: Math.round(b.total) })));
      setStats({
        totalOrders: ordersAll.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        activeDeliveries: deliveries.count ?? 0,
        totalClients: clients.count ?? 0,
        lowStockItems: lowStock,
        totalInventoryValue: totalValue,
        totalRevenue,
        monthRevenue,
        pendingMaintenance: maint.count ?? 0,
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, clients(company_name)")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentOrders(data ?? []);
    };

    fetchAll();
    fetchRecent();
  }, []);

  const fmtMoney = (n: number) =>
    `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    { title: "Ingresos Totales", value: fmtMoney(stats.totalRevenue), icon: DollarSign, color: "text-green-500" },
    { title: "Ventas del Mes", value: fmtMoney(stats.monthRevenue), icon: TrendingUp, color: "text-primary" },
    { title: "Total Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary" },
    { title: "Pedidos Pendientes", value: stats.pendingOrders, icon: ShoppingCart, color: "text-yellow-500" },
    { title: "Mantenimientos Pendientes", value: stats.pendingMaintenance, icon: Wrench, color: "text-orange-500" },
    { title: "Entregas Activas", value: stats.activeDeliveries, icon: Truck, color: "text-blue-500" },
    { title: "Clientes", value: stats.totalClients, icon: Users, color: "text-green-500" },
    { title: "Stock Bajo", value: stats.lowStockItems, icon: AlertTriangle, color: "text-destructive" },
    { title: "Valor Inventario", value: fmtMoney(stats.totalInventoryValue), icon: Package, color: "text-primary" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    confirmed: "bg-blue-500/10 text-blue-500",
    in_progress: "bg-primary/10 text-primary",
    ready: "bg-green-500/10 text-green-500",
    delivered: "bg-green-600/10 text-green-600",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    in_progress: "En Proceso",
    ready: "Listo",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-xl font-bold text-foreground truncate">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Ventas — últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => [fmtMoney(v), "Ventas"]}
                />
                <Area type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ventasGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay pedidos activos</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.clients?.company_name ?? "Sin cliente"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{fmtMoney(Number(order.total))}</span>
                    <Badge className={statusColors[order.status] ?? ""} variant="secondary">
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
