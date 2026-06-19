import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BentoCard } from "./BentoCard";
import type { StatusSlice } from "./DashboardCharts";

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export function DonutStatus({
  title,
  data,
  pulseKey,
}: {
  title: string;
  data: StatusSlice[];
  pulseKey?: number;
}) {
  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <BentoCard pulseKey={pulseKey} className="flex flex-col min-h-[260px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="flex-1 relative flex items-center justify-center min-h-[140px]">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 12,
                color: "#0f172a",
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={3}
              stroke="white"
              strokeWidth={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p
              className="text-2xl font-bold text-slate-900 tabular-nums leading-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {total}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">Total</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
        {data.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="font-medium">{s.name}</span>
            <span className="text-slate-400 tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
