import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base">
          Mapa de pedidos y mantenimientos pendientes
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Región de operaciones: Tabasco, México
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-[420px] rounded-lg overflow-hidden border border-border">
          <MapContainer
            center={center}
            zoom={9}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", background: "#0b0d12" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
            {pins.map((p) => (
              <CircleMarker
                key={`${p.type}-${p.id}`}
                center={[p.lat, p.lng]}
                radius={9}
                pathOptions={{
                  color: p.type === "order" ? "#3b82f6" : "#f97316",
                  fillColor: p.type === "order" ? "#3b82f6" : "#f97316",
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{p.label}</p>
                    {p.sublabel && <p className="text-xs text-muted-foreground">{p.sublabel}</p>}
                    <p className="text-[10px] mt-1 uppercase">
                      {p.type === "order" ? "Pedido" : "Mantenimiento"}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          {pins.length === 0 && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-[400]">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-background/80 backdrop-blur border border-border text-muted-foreground">
                Sin eventos activos
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Pedidos
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" /> Mantenimientos
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
