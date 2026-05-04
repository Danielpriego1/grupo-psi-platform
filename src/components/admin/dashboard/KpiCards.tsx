import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle2, DollarSign } from "lucide-react";

export interface KpiData {
  ordersToday: number;
  pendingOrders: number;
  completedThisMonth: number;
  monthRevenue: number;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function KpiCards({ data }: { data: KpiData }) {
  const cards = [
    { title: "Pedidos hoy", value: data.ordersToday, icon: ShoppingCart, color: "text-primary" },
    { title: "Pedidos pendientes", value: data.pendingOrders, icon: Clock, color: "text-yellow-500" },
    { title: "Completados este mes", value: data.completedThisMonth, icon: CheckCircle2, color: "text-green-500" },
    { title: "Ingresos del mes", value: fmtMoney(data.monthRevenue), icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.title} className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-muted ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{c.title}</p>
              <p className="text-xl font-bold text-foreground truncate">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
