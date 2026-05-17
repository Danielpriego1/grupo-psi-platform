import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Wrench,
  Shield,
  Flame,
  HardHat,
  Star,
  Zap,
  Truck,
  ClipboardCheck,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  wrench: Wrench,
  shield: Shield,
  flame: Flame,
  "hard-hat": HardHat,
  star: Star,
  zap: Zap,
  truck: Truck,
  "clipboard-check": ClipboardCheck,
  "graduation-cap": GraduationCap,
};

export const SERVICE_ICON_OPTIONS = Object.keys(SERVICE_ICONS);

type Service = {
  id: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  sort_order: number;
};

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("service_offerings")
        .select("id, title, description, icon_name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setServices(data as Service[]);
    };
    load();

    const channel = supabase
      .channel("service_offerings-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_offerings" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (services.length === 0) return null;

  return (
    <section className="bg-black py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <span className="inline-block mb-6 rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Especialización
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Nuestros <span className="text-primary glow-text">Servicios</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
            Soluciones integrales en seguridad industrial respaldadas por personal certificado y procesos de alta calidad
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((s) => {
            const Icon = (s.icon_name && SERVICE_ICONS[s.icon_name]) || Wrench;
            return (
              <div
                key={s.id}
                className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:bg-white/[0.08] hover:shadow-[0_30px_60px_-15px_rgba(255,100,0,0.15)]"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-lg shadow-primary/5">
                  <Icon className="h-8 w-8" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-black text-white mb-3 tracking-tight group-hover:text-primary transition-colors">{s.title}</h3>
                {s.description && (
                  <p className="text-base text-gray-400 leading-relaxed font-medium">
                    {s.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
