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
    // Force resize once mounted to avoid grey tile issue inside cards
    setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
  }, []);

  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [18.16, -93.01]; // Nacajuca, Tabasco

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-base">
          Mapa de pedidos y mantenimientos pendientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[420px] rounded-lg overflow-hidden border border-border">
          <MapContainer
            center={center}
            zoom={pins.length > 0 ? 6 : 5}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
