import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { MapPin, LocateFixed } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [18.1667, -93.0167]; // Nacajuca, Tabasco

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 14));
  }, [position, map]);
  return null;
}

export function LocationPicker({ latitude, longitude, onChange, height = "300px" }: LocationPickerProps) {
  const [pos, setPos] = useState<[number, number] | null>(
    latitude != null && longitude != null ? [latitude, longitude] : null
  );

  const handlePick = (lat: number, lng: number) => {
    setPos([lat, lng]);
    onChange({ latitude: lat, longitude: lng });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => handlePick(p.coords.latitude, p.coords.longitude),
      () => {}
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {pos ? (
            <span>
              {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
            </span>
          ) : (
            <span>Haz clic en el mapa para fijar la ubicación</span>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
          <LocateFixed className="w-3.5 h-3.5 mr-1" />
          Usar mi ubicación
        </Button>
      </div>
      <div className="rounded-lg overflow-hidden border border-border" style={{ height }}>
        <MapContainer
          center={pos ?? DEFAULT_CENTER}
          zoom={pos ? 14 : 11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          <Recenter position={pos} />
          {pos && <Marker position={pos} />}
        </MapContainer>
      </div>
    </div>
  );
}
