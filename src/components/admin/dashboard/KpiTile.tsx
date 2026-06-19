import type { LucideIcon } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "indigo" | "amber" | "rose" | "emerald";
  sublabel?: string;
  pulseKey?: number;
  format?: (n: number) => string;
}

const toneStyles: Record<Props["tone"], string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

export function KpiTile({ label, value, icon: Icon, tone, sublabel, pulseKey, format }: Props) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString("es-MX");
  return (
    <BentoCard pulseKey={pulseKey} className="flex flex-col justify-between min-h-[180px]">
      <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center", toneStyles[tone])}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <h3
          className="mt-1 text-[34px] leading-none font-bold text-slate-900 tabular-nums tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {display}
        </h3>
        {sublabel && (
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">{sublabel}</p>
        )}
      </div>
    </BentoCard>
  );
}
