import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { MapPin, LocateFixed, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ResolvedAddress {
  address: string;
  state?: string;
  municipality?: string;
  postalCode?: string;
}

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  onAddressResolved?: (info: ResolvedAddress) => void;
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

  const isSet = pos !== null;

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors ${
          isSet
            ? "border-green-500/40 bg-green-500/10"
            : "border-amber-500/40 bg-amber-500/10"
        }`}
      >
        <div className="flex items-center gap-2 text-xs">
          {isSet ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-green-600 dark:text-green-400">
                  Ubicación confirmada
                </span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {pos![0].toFixed(6)}, {pos![1].toFixed(6)}
                </span>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Haz clic en el mapa para fijar la ubicación
              </span>
            </>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
          <LocateFixed className="w-3.5 h-3.5 mr-1" />
          {isSet ? "Cambiar" : "Mi ubicación"}
        </Button>
      </div>
      <div
        className={`rounded-lg overflow-hidden border-2 transition-colors ${
          isSet ? "border-green-500/50" : "border-border"
        }`}
        style={{ height }}
      >
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
