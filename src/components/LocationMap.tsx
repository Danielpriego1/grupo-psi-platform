import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

export interface LocationMapHandle {
  flyTo: (lat: number, lng: number, zoom: number) => void;
  setPin: (lat: number, lng: number) => void;
}

interface LocationMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  interactive?: boolean;
  showGpsButton?: boolean;
  pinLabel?: string;
  scrollWheelZoom?: boolean;
}

export const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  ({ onLocationSelect, className, defaultCenter = [23.6345, -102.5528], defaultZoom = 5, interactive = true, showGpsButton = false, pinLabel, scrollWheelZoom = true }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const leafletRef = useRef<any>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const placeMarker = useCallback((lat: number, lng: number) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      // Create marker above the target and animate it falling with bounce
      const startLat = lat + 0.008;
      const marker = L.marker([startLat, lng], { 
        bounceOnAdd: false,
        riseOnHover: true,
      }).addTo(map);
      markerRef.current = marker;

      // Animate the drop with 3 bounces
      const duration = 800;
      const startTime = performance.now();
      const bounceHeight = 0.008;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Bounce easing: 3 bounces that decrease in height
        let bounce: number;
        if (progress < 0.36) {
          // First drop
          const t = progress / 0.36;
          bounce = bounceHeight * (1 - t * t);
        } else if (progress < 0.56) {
          // First bounce up/down
          const t = (progress - 0.36) / 0.20;
          const peak = bounceHeight * 0.4;
          bounce = peak * Math.sin(t * Math.PI);
        } else if (progress < 0.72) {
          // Second bounce
          const t = (progress - 0.56) / 0.16;
          const peak = bounceHeight * 0.18;
          bounce = peak * Math.sin(t * Math.PI);
        } else if (progress < 0.85) {
          // Third bounce
          const t = (progress - 0.72) / 0.13;
          const peak = bounceHeight * 0.06;
          bounce = peak * Math.sin(t * Math.PI);
        } else {
          bounce = 0;
        }

        marker.setLatLng([lat + bounce, lng]);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);

      setSelectedLocation({ lat, lng });
      onLocationSelect?.(lat, lng);
    }, [onLocationSelect]);

    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom: number) => {
        mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 });
      },
      setPin: (lat: number, lng: number) => {
        placeMarker(lat, lng);
      },
    }), [placeMarker]);

    const handleGps = () => {
      if (!navigator.geolocation) return;
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          mapRef.current?.flyTo([latitude, longitude], 16, { duration: 1.5 });
          placeMarker(latitude, longitude);
          setGpsLoading(false);
        },
        () => setGpsLoading(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // Initialize map once
    useEffect(() => {
      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      import("leaflet").then((L) => {
        if (!mapContainer.current || mapRef.current) return;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapContainer.current).setView(defaultCenter, defaultZoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        }).addTo(map);

        leafletRef.current = L;
        mapRef.current = map;
        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 200);
      });

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          leafletRef.current = null;
        }
      };
    }, []);

    // Update click handler reactively when interactive prop changes
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const onClick = (e: any) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
      };

      if (interactive) {
        map.on("click", onClick);
      }

      return () => {
        map.off("click", onClick);
      };
    }, [interactive, placeMarker, mapReady]);

    return (
      <div className={className}>
        {showGpsButton && (
          <div className="mb-3 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGps}
              disabled={gpsLoading}
              className="gap-2"
            >
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              Usar mi ubicación actual
            </Button>
          </div>
        )}
        <div
          ref={mapContainer}
          className="h-full w-full overflow-hidden rounded-xl border border-border"
          style={{ zIndex: 0, minHeight: 300 }}
        />
        {selectedLocation && (
          <p className="mt-2 text-xs text-muted-foreground">
            📍 {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
          </p>
        )}
      </div>
    );
  }
);

LocationMap.displayName = "LocationMap";
