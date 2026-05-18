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
          className="relative group rounded-3xl border border-white/5 bg-[#121214] p-8 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 shadow-2xl shadow-black/20 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{c.title}</p>
          <p className="text-4xl font-black text-foreground tracking-tighter leading-none tabular-nums group-hover:text-primary transition-colors duration-300">
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
