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
    <section className="bg-[#09090b] py-32 overflow-hidden border-y border-white/5 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 mb-20 text-center relative z-10">
        <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Partners Estratégicos
        </span>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight uppercase">
          Nuestros <br /><span className="text-primary glow-text">Proveedores</span> y Marcas
        </h2>
        <p className="text-muted-foreground mt-6 text-lg max-w-2xl mx-auto leading-relaxed font-bold">
          Trabajamos con los líderes mundiales en seguridad industrial para garantizar la máxima protección en cada equipo.
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
        <div className="flex w-max animate-brands-marquee group-hover:[animation-play-state:paused] py-10">
          {loop.map((b, i) => (
            <div key={`${b.id}-${i}`} className="shrink-0 px-12 flex items-center">
              {b.logo_url ? (
                <div className="relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all duration-500 shadow-2xl group/item">
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-500"
                    loading="lazy"
                  />

                </div>
              ) : (
                <div className="px-10 py-5 rounded-3xl bg-white/5 border border-white/5">
                  <span className="text-2xl font-black text-white/30 tracking-tighter uppercase group-hover:text-primary transition-colors">
                    {b.name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
