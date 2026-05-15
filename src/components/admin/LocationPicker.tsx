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
  street?: string;
  houseNumber?: string;
  neighborhood?: string;
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

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  onAddressResolved,
  height = "300px",
}: LocationPickerProps) {
  const [pos, setPos] = useState<[number, number] | null>(
    latitude != null && longitude != null ? [latitude, longitude] : null
  );
  const [address, setAddress] = useState<ResolvedAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const handlePick = (lat: number, lng: number) => {
    setPos([lat, lng]);
    onChange({ latitude: lat, longitude: lng });
  };

  // Reverse geocode via Nominatim (OpenStreetMap) — debounced
  useEffect(() => {
    if (!pos) {
      setAddress(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingAddress(true);
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos[0]}&lon=${pos[1]}&accept-language=es&zoom=18&addressdetails=1`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error("Reverse geocode failed");
        const data = await res.json();
        const a = data.address ?? {};
        const street = a.road || a.pedestrian || a.footway || "";
        const houseNumber = a.house_number || "";
        const neighborhood =
          a.neighbourhood || a.suburb || a.quarter || a.residential || a.city_district || "";
        const postalCode = a.postcode || "";
        const municipality =
          a.city || a.town || a.village || a.municipality || a.county || undefined;
        const streetLine = [street, houseNumber].filter(Boolean).join(" ");
        const cpLine = postalCode ? `C.P. ${postalCode}` : "";
        const displayParts = [streetLine, neighborhood, cpLine].filter(Boolean);
        const display = displayParts.length ? displayParts.join(", ") : data.display_name ?? "";
        const resolved: ResolvedAddress = {
          address: display,
          street: street || undefined,
          houseNumber: houseNumber || undefined,
          neighborhood: neighborhood || undefined,
          state: a.state || undefined,
          municipality,
          postalCode: postalCode || undefined,
        };
        setAddress(resolved);
        onAddressResolved?.(resolved);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") setAddress(null);
      } finally {
        setLoadingAddress(false);
      }
    }, 500);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos?.[0], pos?.[1]]);

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
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-green-600 dark:text-green-400">
                  Ubicación confirmada
                </span>
                {loadingAddress ? (
                  <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando dirección…
                  </span>
                ) : address?.address ? (
                  <span className="text-foreground text-[11px] line-clamp-2" title={address.address}>
                    {address.address}
                    {address.municipality ? ` · ${address.municipality}` : ""}
                    {address.state ? `, ${address.state}` : ""}
                  </span>
                ) : null}
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
