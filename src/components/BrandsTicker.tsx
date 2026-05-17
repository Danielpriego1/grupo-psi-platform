import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  sort_order: number;
};

export function BrandsTicker() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("brand_partners")
        .select("id, name, logo_url, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setBrands(data as Brand[]);
    };
    load();

    const channel = supabase
      .channel("brand_partners-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_partners" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (brands.length === 0) return null;

  const loop = [...brands, ...brands];

  return (
    <section className="bg-background py-32 overflow-hidden border-y border-border/20">
      <div className="container mx-auto px-4 mb-20 text-center">
        <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Partners Estratégicos
        </span>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
          Trabajamos con las <br /><span className="text-primary glow-text">mejores marcas</span>
        </h2>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto leading-relaxed">
          Distribuidores autorizados de las marcas líderes en seguridad industrial a nivel global
        </p>
      </div>

      <div
        className="group relative"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="flex w-max animate-brands-marquee group-hover:[animation-play-state:paused]">
          {loop.map((b, i) => (
            <div key={`${b.id}-${i}`} className="shrink-0 px-6 flex items-center">
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={b.name}
                  className="h-16 w-auto object-contain opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500"
                  loading="lazy"
                />
              ) : (
                <span className="inline-flex items-center px-6 py-3 rounded-full bg-gray-800 text-white font-semibold text-base tracking-wide ring-1 ring-gray-700 hover:ring-primary/50 transition">
                  {b.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
