import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";

export interface MonthlyPoint {
  month: string;
  ventas: number;
}

export interface StatusSlice {
  name: string;
  value: number;
}

const CHART_BLUE = "#3b82f6";
const PIE_COLORS = ["#3b82f6", "#6366f1", "#22c55e", "#eab308", "#ef4444", "#a855f7"];

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type Range = "7d" | "30d" | "6m";

function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const opts: Range[] = ["7d", "30d", "6m"];
  return (
    <div className="inline-flex items-center rounded-md border border-white/10 bg-card/40 p-0.5">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "px-2 py-0.5 text-[11px] font-medium rounded-[5px] transition-colors",
            value === o
              ? "bg-white/[0.08] text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  showRange = true,
  delay = 0,
  range,
  onRangeChange,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showRange?: boolean;
  delay?: number;
  range?: Range;
  onRangeChange?: (r: Range) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="rounded-[10px] border border-white/10 bg-card/60 p-5"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {showRange && range && onRangeChange && <RangeSelector value={range} onChange={onRangeChange} />}
      </div>
      <div className="h-56">{children}</div>
    </motion.div>
  );
}

export function DashboardCharts({
  monthly,
  ordersByStatus,
  maintByStatus,
}: {
  monthly: MonthlyPoint[];
  ordersByStatus: StatusSlice[];
  maintByStatus: StatusSlice[];
}) {
  const [revRange, setRevRange] = useState<Range>("6m");
  const [ordersRange, setOrdersRange] = useState<Range>("30d");
  const [maintRange, setMaintRange] = useState<Range>("30d");

  const sliced =
    revRange === "7d" ? monthly.slice(-1) : revRange === "30d" ? monthly.slice(-2) : monthly;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <ChartCard
        title="Ingresos"
        subtitle="Ventas totales"
        delay={0}
        range={revRange}
        onRangeChange={setRevRange}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sliced} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtMoney(v), "Ventas"]} />
            <Area type="monotone" dataKey="ventas" stroke={CHART_BLUE} strokeWidth={2} fill="url(#vg)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Pedidos por estado"
        subtitle="Distribución actual"
        delay={0.05}
        range={ordersRange}
        onRangeChange={setOrdersRange}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ordersByStatus} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2}>
              {ordersByStatus.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Mantenimientos"
        subtitle="Por estatus"
        delay={0.1}
        range={maintRange}
        onRangeChange={setMaintRange}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={maintByStatus} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={CHART_BLUE} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
