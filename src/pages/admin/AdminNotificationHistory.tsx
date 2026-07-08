import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Bell,
  Package,
  FileText,
  Wrench,
  Sparkles,
  CheckCheck,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/hooks/useRelativeTime";
import { useAuth } from "@/hooks/useAuth";

type Event = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  tag: string | null;
  ref_number: string | null;
  sent: number;
  removed: number;
  failed: number;
  total_targets: number;
  status: string;
  read_at: string | null;
  created_at: string;
};

const KIND_META: Record<
  string,
  { label: string; icon: typeof Bell; tint: string }
> = {
  order: { label: "Pedido", icon: Package, tint: "bg-indigo-500/15 text-indigo-300" },
  quote: { label: "Cotización", icon: FileText, tint: "bg-amber-500/15 text-amber-300" },
  maintenance: { label: "Mantenimiento", icon: Wrench, tint: "bg-sky-500/15 text-sky-300" },
  other: { label: "Otro", icon: Sparkles, tint: "bg-white/10 text-muted-foreground" },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  sent: { label: "Enviada", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  partial: { label: "Parcial", className: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
  failed: { label: "Falló", className: "bg-red-500/15 text-red-300 border-red-500/20" },
  no_targets: { label: "Sin dispositivos", className: "bg-white/10 text-muted-foreground border-white/10" },
};

export default function AdminNotificationHistory() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast.error("No se pudo cargar el historial", { description: error.message });
      return;
    }
    setEvents((data ?? []) as Event[]);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("notif-events-history")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_events" },
        (payload) => {
          setEvents((prev) => [payload.new as Event, ...prev].slice(0, 200));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notification_events" },
        (payload) => {
          setEvents((prev) => prev.filter((e) => e.id !== (payload.old as any).id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (kindFilter !== "all" && (e.kind || "other") !== kindFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    });
  }, [events, kindFilter, statusFilter]);

  const unreadCount = events.filter((e) => !e.read_at).length;

  const markAllRead = async () => {
    setBusy(true);
    const ids = events.filter((e) => !e.read_at).map((e) => e.id);
    if (ids.length === 0) { setBusy(false); return; }
    const { error } = await supabase
      .from("notification_events")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    setBusy(false);
    if (error) return toast.error("No se pudo actualizar", { description: error.message });
    setEvents((prev) => prev.map((e) => (e.read_at ? e : { ...e, read_at: new Date().toISOString() })));
    toast.success(`${ids.length} notificaciones marcadas como leídas`);
  };

  const toggleRead = async (ev: Event) => {
    const nextRead = ev.read_at ? null : new Date().toISOString();
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, read_at: nextRead } : e)));
    const { error } = await supabase
      .from("notification_events")
      .update({ read_at: nextRead })
      .eq("id", ev.id);
    if (error) {
      toast.error("No se pudo actualizar");
      load();
    }
  };

  const deleteOne = async (id: string) => {
    const prev = events;
    setEvents((p) => p.filter((e) => e.id !== id));
    const { error } = await supabase.from("notification_events").delete().eq("id", id);
    if (error) { setEvents(prev); toast.error("No se pudo eliminar"); }
  };

  const clearRead = async () => {
    if (!confirm("¿Eliminar todas las notificaciones ya leídas?")) return;
    setBusy(true);
    const { error } = await supabase
      .from("notification_events")
      .delete()
      .not("read_at", "is", null);
    setBusy(false);
    if (error) return toast.error("No se pudo limpiar", { description: error.message });
    setEvents((prev) => prev.filter((e) => !e.read_at));
    toast.success("Historial de leídas limpiado");
  };

  const clearAll = async () => {
    if (!confirm("¿Eliminar TODO el historial de notificaciones? Esta acción no se puede deshacer.")) return;
    setBusy(true);
    const ids = events.map((e) => e.id);
    if (ids.length === 0) { setBusy(false); return; }
    const { error } = await supabase.from("notification_events").delete().in("id", ids);
    setBusy(false);
    if (error) return toast.error("No se pudo limpiar", { description: error.message });
    setEvents([]);
    toast.success("Historial eliminado");
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Historial de notificaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todo lo que Grupo PSI ha enviado a tus dispositivos push · {events.length} eventos
            {unreadCount > 0 && (
              <span className="ml-2 text-primary">· {unreadCount} sin leer</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={busy || unreadCount === 0}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Marcar todas leídas
          </Button>
          <Button variant="outline" size="sm" onClick={clearRead} disabled={busy}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Limpiar leídas
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-300 border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
            onClick={clearAll}
            disabled={busy || events.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Vaciar todo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-[#0d0d10] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="order">Pedido</SelectItem>
              <SelectItem value="quote">Cotización</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-[#0d0d10] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="failed">Falló</SelectItem>
              <SelectItem value="no_targets">Sin dispositivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-[11px] text-muted-foreground ml-auto">
          Mostrando {filtered.length} de {events.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-[#0d0d10] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Cargando historial…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No hay notificaciones que coincidan con los filtros.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Cuándo</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Notificación</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Entrega</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const meta = KIND_META[e.kind] ?? KIND_META.other;
                const Icon = meta.icon;
                const status = STATUS_META[e.status] ?? STATUS_META.sent;
                const isUnread = !e.read_at;
                return (
                  <TableRow
                    key={e.id}
                    className={cn(
                      "border-white/5 hover:bg-white/[0.02]",
                      isUnread && "bg-primary/[0.03]",
                    )}
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top">
                      <div>{formatRelative(e.created_at)}</div>
                      <div className="text-[10px] opacity-60">
                        {new Date(e.created_at).toLocaleString("es-MX", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center", meta.tint)}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-medium text-foreground">{meta.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top max-w-md">
                      <div className="flex items-start gap-2">
                        {isUnread && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {e.title}
                          </p>
                          {e.body && (
                            <p className="text-xs text-muted-foreground truncate">{e.body}</p>
                          )}
                          {e.ref_number && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
                              {e.ref_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-[11px] text-muted-foreground leading-tight">
                        <div>
                          <span className="text-emerald-300 font-semibold">{e.sent}</span> enviadas
                        </div>
                        <div>
                          {e.failed > 0 && (
                            <span className="text-red-300">{e.failed} fallaron · </span>
                          )}
                          {e.removed > 0 && (
                            <span>{e.removed} expiradas · </span>
                          )}
                          <span>{e.total_targets} dispositivos</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        status.className,
                      )}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {e.url && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Link to={e.url} aria-label="Abrir">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleRead(e)}
                          aria-label={isUnread ? "Marcar leída" : "Marcar no leída"}
                        >
                          <CheckCheck className={cn("w-3.5 h-3.5", !isUnread && "text-emerald-300")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-300"
                          onClick={() => deleteOne(e.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
