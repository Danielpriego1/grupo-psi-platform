import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiData {
  ordersToday: number;
  pendingOrders: number;
  completedThisMonth: number;
  monthRevenue: number;
  /** % change vs previous month. Optional. */
  ordersTodayChange?: number;
  pendingOrdersChange?: number;
  completedChange?: number;
  revenueChange?: number;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function ChangeBadge({ value }: { value?: number }) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return <span className="text-[11px] text-muted-foreground">— vs mes anterior</span>;
  }
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        positive ? "text-emerald-400" : "text-rose-400",
      )}
    >
      <Icon className="w-3 h-3" strokeWidth={2.25} />
      {positive ? "+" : ""}
      {value.toFixed(1)}%
      <span className="text-muted-foreground font-normal">vs mes anterior</span>
    </span>
  );
}

export function KpiCards({ data }: { data: KpiData }) {
  const cards = [
    { title: "Pedidos hoy", value: String(data.ordersToday), change: data.ordersTodayChange },
    { title: "Pedidos pendientes", value: String(data.pendingOrders), change: data.pendingOrdersChange },
    { title: "Completados este mes", value: String(data.completedThisMonth), change: data.completedChange },
    { title: "Ingresos del mes", value: fmtMoney(data.monthRevenue), change: data.revenueChange },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.1, ease: "easeOut" }}
          className="rounded-[10px] border border-white/10 bg-card/60 px-5 py-4 hover:border-white/15 transition-colors"
        >
          <p className="text-[12px] font-medium text-muted-foreground tracking-tight">{c.title}</p>
          <p className="mt-2 text-[28px] font-semibold text-foreground tracking-tight leading-none tabular-nums">
            {c.value}
          </p>
          <div className="mt-3">
            <ChangeBadge value={c.change} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
