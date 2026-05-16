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
    <section className="bg-gray-950 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Nuestros <span className="text-primary">Servicios</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            Soluciones integrales en seguridad industrial respaldadas por personal certificado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((s) => {
            const Icon = (s.icon_name && SERVICE_ICONS[s.icon_name]) || Wrench;
            return (
              <div
                key={s.id}
                className="group rounded-2xl bg-gray-800/50 border border-gray-700 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.35)]"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary group-hover:bg-primary/20 transition">
                  <Icon className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                {s.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">
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
