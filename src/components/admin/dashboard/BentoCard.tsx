import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  pulseKey?: string | number;
  padding?: boolean;
}

/**
 * Bento tile in light scheme. When `pulseKey` changes, a soft indigo ring
 * glow plays for 700ms to signal a realtime update.
 */
export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  ({ children, className, pulseKey, padding = true }, ref) => {
    const [pulse, setPulse] = useState(false);
    useEffect(() => {
      if (pulseKey === undefined) return;
      setPulse(true);
      const id = setTimeout(() => setPulse(false), 750);
      return () => clearTimeout(id);
    }, [pulseKey]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[28px] border border-slate-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.08)] transition-all duration-300",
          "hover:border-indigo-200 hover:shadow-[0_4px_12px_-2px_rgba(79,70,229,0.08),0_16px_40px_-12px_rgba(79,70,229,0.18)]",
          padding && "p-6",
          pulse && "ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-slate-50",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
BentoCard.displayName = "BentoCard";
