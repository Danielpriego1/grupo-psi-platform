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
    <section className="bg-gray-900 py-14 overflow-hidden">
      <div className="container mx-auto px-4 mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Trabajamos con las <span className="text-primary">mejores marcas</span>
        </h2>
        <p className="text-gray-400 mt-2 text-sm">
          Distribuidores autorizados de las marcas líderes en seguridad industrial
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
                  className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
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
