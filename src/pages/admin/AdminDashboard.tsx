import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck, Package, Users, AlertTriangle, TrendingUp } from "lucide-react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  activeDeliveries: number;
  totalClients: number;
  lowStockItems: number;
  totalInventoryValue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
    totalClients: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [orders, pendingOrders, deliveries, clients, inventory] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed"]),
        supabase.from("deliveries").select("id", { count: "exact", head: true }).in("status", ["assigned", "in_transit"]),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("inventory").select("stock, min_stock, unit_price"),
      ]);

      const inv = inventory.data ?? [];
      const lowStock = inv.filter((i) => i.stock <= i.min_stock).length;
      const totalValue = inv.reduce((sum, i) => sum + i.stock * Number(i.unit_price), 0);

      setStats({
        totalOrders: orders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        activeDeliveries: deliveries.count ?? 0,
        totalClients: clients.count ?? 0,
        lowStockItems: lowStock,
        totalInventoryValue: totalValue,
      });
    };

    const fetchRecent = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, clients(company_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentOrders(data ?? []);
    };

    fetchStats();
    fetchRecent();
  }, []);

  const cards = [
    { title: "Total Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary" },
    { title: "Pedidos Pendientes", value: stats.pendingOrders, icon: ShoppingCart, color: "text-yellow-500" },
    { title: "Entregas Activas", value: stats.activeDeliveries, icon: Truck, color: "text-blue-500" },
    { title: "Clientes", value: stats.totalClients, icon: Users, color: "text-green-500" },
    { title: "Stock Bajo", value: stats.lowStockItems, icon: AlertTriangle, color: "text-destructive" },
    {
      title: "Valor Inventario",
      value: `$${stats.totalInventoryValue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-primary",
    },
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
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay pedidos todavía</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.clients?.company_name ?? "Sin cliente"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(order.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
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
