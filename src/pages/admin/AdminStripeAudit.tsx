import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Eye } from "lucide-react";

interface AuditEvent {
  id: string;
  event_id: string | null;
  event_type: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  order_id: string | null;
  order_number: string | null;
  payment_status: string | null;
  processing_status: string;
  ticket_generated: boolean;
  ticket_token: string | null;
  error_message: string | null;
  raw_payload: any;
  received_at: string;
  processed_at: string | null;
}

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "medium",
});

function statusBadge(status: string) {
  switch (status) {
    case "success":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Éxito
        </Badge>
      );
    case "error":
      return (
        <Badge className="bg-red-500/15 text-red-400 hover:bg-red-500/20 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" /> Error
        </Badge>
      );
    case "skipped":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Omitido
        </Badge>
      );
    case "received":
    default:
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" /> Recibido
        </Badge>
      );
  }
}

function paymentBadge(status: string | null) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    expired: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return <Badge className={map[status] ?? "bg-muted text-foreground"}>{status}</Badge>;
}

export default function AdminStripeAudit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("stripe_webhook_events")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(500);
    if (!error && data) setEvents(data as AuditEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useRealtimeTable({
    table: "stripe_webhook_events",
    onChange: () => fetchEvents(),
  });

  const types = useMemo(
    () => Array.from(new Set(events.map((e) => e.event_type))).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (statusFilter !== "all" && e.processing_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.order_number ?? ""} ${e.stripe_session_id ?? ""} ${e.event_id ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, typeFilter, statusFilter, search]);

  const kpis = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = events.filter((e) => new Date(e.received_at).getTime() >= dayAgo);
    const success = recent.filter((e) => e.processing_status === "success").length;
    const errors = recent.filter((e) => e.processing_status === "error").length;
    const paid = recent.filter((e) => e.payment_status === "paid").length;
    return {
      total: recent.length,
      successRate: recent.length ? Math.round((success / recent.length) * 100) : 0,
      paid,
      errors,
    };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Eventos 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Tasa de éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-500">{kpis.successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Pagos confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Errores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-400">{kpis.errors}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Buscar por pedido, session_id o event_id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="md:w-[260px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Éxito</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="skipped">Omitido</SelectItem>
              <SelectItem value="received">Recibido</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchEvents} className="ml-auto">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Ticket/QR</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Sin eventos
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {dateFmt.format(new Date(e.received_at))}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{e.event_type}</TableCell>
                    <TableCell className="text-xs">
                      {e.order_number ? (
                        <Link to="/admin/orders" className="text-primary hover:underline">
                          {e.order_number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{paymentBadge(e.payment_status)}</TableCell>
                    <TableCell>{statusBadge(e.processing_status)}</TableCell>
                    <TableCell>
                      {e.ticket_generated ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalle */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-sm">{selected.event_type}</SheetTitle>
                <SheetDescription>
                  Recibido: {dateFmt.format(new Date(selected.received_at))}
                  {selected.processed_at && (
                    <> · Procesado: {dateFmt.format(new Date(selected.processed_at))}</>
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Resultado</p>
                    <div className="mt-1">{statusBadge(selected.processing_status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment status</p>
                    <div className="mt-1">{paymentBadge(selected.payment_status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pedido</p>
                    <p className="font-mono text-xs">{selected.order_number ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ticket generado</p>
                    <p>{selected.ticket_generated ? "Sí" : "No"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Session ID</p>
                    <p className="font-mono text-xs break-all">{selected.stripe_session_id ?? "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Payment Intent</p>
                    <p className="font-mono text-xs break-all">{selected.stripe_payment_intent ?? "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Event ID</p>
                    <p className="font-mono text-xs break-all">{selected.event_id ?? "—"}</p>
                  </div>
                </div>

                {selected.error_message && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                    <p className="text-xs font-mono whitespace-pre-wrap">{selected.error_message}</p>
                  </div>
                )}

                {selected.ticket_token && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`/ticket/${selected.ticket_token}`} target="_blank" rel="noreferrer">
                      Ver ticket
                    </a>
                  </Button>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payload</p>
                  <pre className="text-[10px] font-mono bg-muted/40 p-3 rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                    {JSON.stringify(selected.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
