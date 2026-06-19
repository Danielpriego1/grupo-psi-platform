import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BentoCard } from "./BentoCard";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type: "order" | "maintenance";
}

export function PendingOrdersMap({ pins }: { pins: MapPin[] }) {
  useEffect(() => {
    setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
  }, []);

  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [17.9869, -92.9303];

  return (
    <BentoCard padding={false} className="overflow-hidden flex flex-col min-h-[420px]">
      <div className="absolute top-5 left-5 z-[450] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-lg shadow-slate-200/60">
        <h4
          className="font-bold text-slate-900 text-sm"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Mapa de operaciones
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">Tabasco, México</p>
        <div className="flex gap-3 mt-2.5 text-[10px] font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Pedidos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Mtto.
          </span>
        </div>
      </div>

      <div className="absolute top-5 right-5 z-[450] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {pins.length} activos
        </span>
      </div>

      <div className="flex-1 rounded-[28px] overflow-hidden">
        <MapContainer
          center={center}
          zoom={9}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", minHeight: 420, background: "#f1f5f9" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {pins.map((p) => (
            <CircleMarker
              key={`${p.type}-${p.id}`}
              center={[p.lat, p.lng]}
              radius={9}
              pathOptions={{
                color: p.type === "order" ? "#4f46e5" : "#f59e0b",
                fillColor: p.type === "order" ? "#4f46e5" : "#f59e0b",
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{p.label}</p>
                  {p.sublabel && <p className="text-xs text-slate-500">{p.sublabel}</p>}
                  <p className="text-[10px] mt-1 uppercase">
                    {p.type === "order" ? "Pedido" : "Mantenimiento"}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </BentoCard>
  );
}
