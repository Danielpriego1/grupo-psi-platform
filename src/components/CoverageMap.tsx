import { useEffect, useRef } from "react";
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

// Estados de cobertura principal con coordenadas de sus capitales
const COVERAGE_STATES: { name: string; lat: number; lng: number; primary?: boolean }[] = [
  { name: "Tabasco", lat: 17.9869, lng: -92.9303, primary: true },
  { name: "Veracruz", lat: 19.1738, lng: -96.1342 },
  { name: "Campeche", lat: 19.8301, lng: -90.5349 },
  { name: "Oaxaca", lat: 17.0732, lng: -96.7266 },
  { name: "Chiapas", lat: 16.7569, lng: -93.1292 },
];

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

    // Inyectar estilos de pulso (una sola vez)
    if (!document.getElementById("coverage-pulse-styles")) {
      const style = document.createElement("style");
      style.id = "coverage-pulse-styles";
      style.textContent = `
        .coverage-pin { position: relative; width: 22px; height: 22px; }
        .coverage-pin .core {
          position: absolute; inset: 6px; border-radius: 9999px;
          background: hsl(var(--primary, 24 95% 53%));
          box-shadow: 0 0 12px 2px hsl(var(--primary, 24 95% 53%) / 0.9), 0 0 0 2px #fff;
        }
        .coverage-pin .ring {
          position: absolute; inset: 0; border-radius: 9999px;
          border: 2px solid hsl(var(--primary, 24 95% 53%));
          animation: coverage-pulse 2s ease-out infinite;
          opacity: 0;
        }
        .coverage-pin .ring.r2 { animation-delay: 0.6s; }
        .coverage-pin .ring.r3 { animation-delay: 1.2s; }
        .coverage-pin.primary .core {
          background: #f97316;
          box-shadow: 0 0 18px 4px rgba(249,115,22,0.9), 0 0 0 2px #fff;
        }
        .coverage-pin.primary .ring { border-color: #f97316; }
        .coverage-label {
          position: absolute; left: 50%; top: -22px; transform: translateX(-50%);
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
          color: #fff; white-space: nowrap; text-transform: uppercase;
          text-shadow: 0 1px 4px rgba(0,0,0,0.9);
        }
        @keyframes coverage-pulse {
          0%   { transform: scale(0.6); opacity: 0.9; }
          80%  { transform: scale(3.2); opacity: 0; }
          100% { transform: scale(3.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapContainer.current || mapRef.current) return;

      const map = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([17.5, -93.5], 6);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Pines animados para estados de cobertura
      const latlngs: [number, number][] = [];
      COVERAGE_STATES.forEach((s) => {
        latlngs.push([s.lat, s.lng]);
        const icon = L.divIcon({
          className: "",
          html: `
            <div class="coverage-pin ${s.primary ? "primary" : ""}">
              <span class="coverage-label">${s.name}</span>
              <span class="ring"></span>
              <span class="ring r2"></span>
              <span class="ring r3"></span>
              <span class="core"></span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker([s.lat, s.lng], { icon }).addTo(map);
      });

      // Polígono suave conectando estados (halo de cobertura)
      L.polygon(
        [
          [19.83, -90.53],
          [19.17, -96.13],
          [17.07, -96.72],
          [16.75, -93.12],
          [17.98, -92.93],
        ],
        {
          color: "#f97316",
          weight: 1,
          opacity: 0.5,
          fillColor: "#f97316",
          fillOpacity: 0.08,
          dashArray: "4 6",
        }
      ).addTo(map);

      // Pines operativos opcionales (eventos)
      pins.forEach((pin) => {
        const meta = TYPE_META[pin.type];
        L.circleMarker([pin.lat, pin.lng], {
          radius: 6,
          color: meta.color,
          fillColor: meta.color,
          fillOpacity: 0.9,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<strong>${meta.label}</strong>${pin.label ? `<br/>${pin.label}` : ""}`);
      });

      // Ajustar vista a la región de cobertura
      map.fitBounds(latlngs as any, { padding: [40, 40] });

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
    <section className="relative py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Presencia Regional
          </span>
          <h2 className="mb-4 text-4xl sm:text-5xl font-black tracking-tight">
            Donde <span className="text-primary glow-text">operamos</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Cobertura estratégica en Tabasco, Veracruz, Campeche, Oaxaca y Chiapas
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-5xl">
          <div
            ref={mapContainer}
            className="h-[480px] w-full overflow-hidden rounded-2xl border border-primary/20 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)]"
            style={{ zIndex: 0, background: "#0b0d12" }}
          />

          {/* Badge de estados */}
          <div className="absolute top-3 right-3 z-[1] hidden sm:flex flex-wrap gap-1.5 max-w-[260px] justify-end">
            {COVERAGE_STATES.map((s) => (
              <span
                key={s.name}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur border ${
                  s.primary
                    ? "bg-primary/90 text-white border-primary"
                    : "bg-card/80 text-foreground border-border"
                }`}
              >
                {s.name}
              </span>
            ))}
          </div>

          {/* Legend */}
          {activeTypes.length > 0 && (
            <div className="absolute bottom-3 left-3 z-[1] rounded-lg border border-border bg-card/90 px-3 py-2 text-xs text-foreground shadow-md backdrop-blur">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Eventos activos
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

          {/* Footer counter */}
          <div className="absolute bottom-3 right-3 z-[1] flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            5 estados · sureste de México
          </div>
        </div>
      </div>
    </section>
  );
}
