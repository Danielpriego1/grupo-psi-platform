import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Phone, Mail, Calendar, Clock, Wrench } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

type ReqStatus = Database["public"]["Enums"]["maintenance_request_status"];

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

const STATUS_LABEL: Record<ReqStatus, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  scheduled: "Agendado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<ReqStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  contacted: "bg-blue-500/10 text-blue-500",
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-green-500/10 text-green-500",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_HEX: Record<ReqStatus, string> = {
  pending: "#eab308",
  contacted: "#3b82f6",
  scheduled: "#f97316",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

interface MaintReq {
  id: string;
  folio: string | null;
  tracking_code: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string | null;
  state: string | null;
  municipality: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string | null;
  time_slot: string | null;
  equipment_items: any;
  total_units: number;
  additional_notes: string | null;
  service_type: string | null;
  equipment_type: string | null;
  status: ReqStatus;
  created_at: string;
}

export default function AdminMaintenance() {
  const [requests, setRequests] = useState<MaintReq[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const fetchData = async () => {
    const { data } = await supabase
      .from("maintenance_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data as MaintReq[]) ?? []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeTable({ table: "maintenance_requests", onChange: () => fetchData() });

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter]
  );

  // Init map
  useEffect(() => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    import("leaflet").then((L) => {
      if (!mapContainer.current || mapRef.current) return;
      const map = L.map(mapContainer.current).setView([23.6345, -102.5528], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OSM',
      }).addTo(map);
      leafletRef.current = L;
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        leafletRef.current = null;
        markersRef.current.clear();
      }
    };
  }, []);

  // Update markers when filtered changes
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current.clear();

    const points: [number, number][] = [];
    filtered.forEach((r) => {
      if (r.latitude == null || r.longitude == null) return;
      const color = STATUS_HEX[r.status];
      const icon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px ${color}66, 0 2px 6px rgba(0,0,0,.4);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([r.latitude, r.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:inherit;min-width:180px;">
            <strong>${r.contact_name}</strong><br/>
            <span style="font-size:11px;color:#666">${r.municipality ?? ""}, ${r.state ?? ""}</span><br/>
            <span style="font-size:11px">${r.total_units} equipo(s)</span>
          </div>`
        )
        .on("click", () => setSelected(r.id));
      markersRef.current.set(r.id, marker);
      points.push([r.latitude, r.longitude]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [filtered]);

  const updateStatus = async (id: string, status: ReqStatus) => {
    await supabase.from("maintenance_requests").update({ status }).eq("id", id);
    fetchData();
  };

  const focusOn = (r: MaintReq) => {
    setSelected(r.id);
    if (r.latitude != null && r.longitude != null && mapRef.current) {
      mapRef.current.flyTo([r.latitude, r.longitude], 14, { duration: 1.2 });
      const m = markersRef.current.get(r.id);
      m?.openPopup();
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const todayCount = requests.filter((r) => r.created_at?.slice(0, 10) === todayStr).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Pendientes</p><p className="text-2xl font-bold text-yellow-500">{pendingCount}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Nuevas hoy</p><p className="text-2xl font-bold text-primary">{todayCount}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p><p className="text-2xl font-bold text-foreground">{requests.length}</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Solicitudes ({filtered.length})</h2>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div
              ref={mapContainer}
              className="w-full rounded-xl overflow-hidden"
              style={{ height: 520, zIndex: 0 }}
            />
          </CardContent>
        </Card>

        {/* List */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-foreground text-base">Solicitudes</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin solicitudes</p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => focusOn(r)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selected === r.id ? "bg-primary/10 border-primary" : "bg-muted/40 border-transparent hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-foreground text-sm">{r.contact_name}</p>
                    <Badge className={STATUS_COLOR[r.status]} variant="secondary">
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {r.municipality ?? "—"}, {r.state ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.total_units} equipo(s) · {r.scheduled_date ? format(new Date(r.scheduled_date), "d MMM", { locale: es }) : "Sin fecha"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail */}
      {selected && (() => {
        const r = filtered.find((x) => x.id === selected);
        if (!r) return null;
        return (
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">{r.contact_name}</CardTitle>
                <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as ReqStatus)}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{r.contact_phone}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{r.contact_email}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />{r.scheduled_date ? format(new Date(r.scheduled_date), "d 'de' MMMM yyyy", { locale: es }) : "Sin fecha"}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" />{r.time_slot ?? "—"}</p>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>
                  {r.address ? `${r.address}, ` : ""}
                  CP {r.postal_code ?? "—"}, {r.municipality ?? ""}, {r.state ?? ""}
                </span>
              </div>
              {Array.isArray(r.equipment_items) && r.equipment_items.length > 0 && (
                <div>
                  <p className="font-medium text-foreground mb-2">Equipos ({r.total_units} unid.)</p>
                  <div className="space-y-1.5">
                    {r.equipment_items.map((it: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                        <span className="font-medium text-foreground capitalize">{it.category || "—"}</span>
                        {it.type && ` · ${it.type}`}
                        {it.weight && ` · ${it.weight}`}
                        {it.scbaPsi && ` · ${it.scbaPsi}`}
                        {it.scbaMinutes && ` · ${it.scbaMinutes}`}
                        {it.detectorBrand && ` · ${it.detectorBrand}`}
                        {` · x${it.quantity}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.additional_notes && (
                <p className="text-xs text-muted-foreground italic">"{r.additional_notes}"</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${r.contact_phone}`}>Llamar</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`https://wa.me/52${r.contact_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </Button>
                {r.latitude != null && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
