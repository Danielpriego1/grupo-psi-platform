import { useEffect, useRef, useState } from "react";
import { MapPin, Wrench, RotateCw, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

export type CoveragePin = {
  lat: number;
  lng: number;
  type: "mantenimiento" | "recarga" | "visita";
  label?: string;
};

interface CoverageMapProps {
  pins?: CoveragePin[];
}

const TYPE_META: Record<CoveragePin["type"], { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  mantenimiento: { label: "Mantenimiento", color: "#ea580c", icon: Wrench },
  recarga: { label: "Recarga", color: "#3b82f6", icon: RotateCw },
  visita: { label: "Visita", color: "#22c55e", icon: ClipboardCheck },
};

export function CoverageMap({ pins = [] }: CoverageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapContainer.current || mapRef.current) return;

      const map = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([17.9869, -92.9303], 7);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      pins.forEach((pin) => {
        const meta = TYPE_META[pin.type];
        L.circleMarker([pin.lat, pin.lng], {
          radius: 7,
          color: meta.color,
          fillColor: meta.color,
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<strong>${meta.label}</strong>${pin.label ? `<br/>${pin.label}` : ""}`);
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTypes = Array.from(new Set(pins.map((p) => p.type)));

  return (
    <section className="relative py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-primary">
            Cobertura
          </span>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Donde <span className="text-primary">operamos</span>
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Cobertura en Tabasco y sureste de México
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-5xl">
          <div
            ref={mapContainer}
            className="h-[420px] w-full overflow-hidden rounded-2xl border border-border"
            style={{ zIndex: 0, background: "#0b0d12" }}
          />

          {/* No-events badge */}
          {pins.length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur">
                <MapPin className="h-4 w-4" />
                Sin eventos activos
              </div>
            </div>
          )}

          {/* Legend */}
          {activeTypes.length > 0 && (
            <div className="absolute bottom-3 left-3 z-[1] rounded-lg border border-border bg-card/90 px-3 py-2 text-xs text-foreground shadow-md backdrop-blur">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Leyenda
              </div>
              <div className="flex flex-col gap-1.5">
                {activeTypes.map((t) => {
                  const meta = TYPE_META[t];
                  const Icon = meta.icon;
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
