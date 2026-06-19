import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BentoCard } from "./BentoCard";
import type { StatusSlice } from "./DashboardCharts";

export function BarMaintenance({
  title,
  data,
  pulseKey,
}: {
  title: string;
  data: StatusSlice[];
  pulseKey?: number;
}) {
  return (
    <BentoCard pulseKey={pulseKey} className="flex flex-col min-h-[260px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
        {title}
      </p>
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#eef2ff" }}
              contentStyle={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 12,
                color: "#0f172a",
              }}
            />
            <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}
