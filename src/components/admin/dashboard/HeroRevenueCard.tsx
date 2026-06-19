import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { BentoCard } from "./BentoCard";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "./DashboardCharts";

interface Props {
  amount: number;
  change?: number;
  monthly: MonthlyPoint[];
  pulseKey?: number;
}

const fmtMoney = (n: number) =>
  `$${Math.round(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

export function HeroRevenueCard({ amount, change, monthly, pulseKey }: Props) {
  const animated = useCountUp(amount);
  const positive = (change ?? 0) >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <BentoCard pulseKey={pulseKey} className="flex flex-col justify-between min-h-[260px] overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Ingresos del mes
          </p>
          <h2
            className="mt-3 text-[44px] leading-none font-bold text-slate-900 tabular-nums tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {fmtMoney(animated)}
          </h2>
          {change !== undefined && !Number.isNaN(change) && (
            <div
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 text-sm font-medium",
                positive ? "text-emerald-600" : "text-rose-600",
              )}
            >
              <Arrow className="w-4 h-4" />
              <span>
                {positive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              <span className="text-slate-400 font-normal">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <DollarSign className="w-6 h-6" strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-6 h-24 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthly} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="hero-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
              contentStyle={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 12,
                color: "#0f172a",
              }}
              formatter={(v: number) => [fmtMoney(v), "Ventas"]}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#4f46e5"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="url(#hero-rev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}
