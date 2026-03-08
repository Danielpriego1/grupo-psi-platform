import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// Dynamically load leaflet CSS
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

interface LocationMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  defaultCenter?: [number, number];
}

export function LocationMap({ onLocationSelect, className, defaultCenter = [17.9869, -92.9303] }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Dynamically import leaflet
    import("leaflet").then((L) => {
      if (!mapContainer.current || mapRef.current) return;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Center on Mexico City
      const map = L.map(mapContainer.current).setView([17.9869, -92.9303], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        setSelectedLocation({ lat, lng });
        onLocationSelect?.(lat, lng);
      });

      mapRef.current = map;
      setLoaded(true);

      // Fix map rendering in containers
      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Haz clic en el mapa para seleccionar ubicación</span>
      </div>
      <div
        ref={mapContainer}
        className="h-[280px] w-full overflow-hidden rounded-xl border border-border"
        style={{ zIndex: 0 }}
      />
      {selectedLocation && (
        <p className="mt-2 text-xs text-muted-foreground">
          📍 {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
