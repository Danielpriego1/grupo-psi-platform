import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Ticket as TicketIcon,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

const moneyFmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

const PAYMENT_LABEL: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  failed: "Rechazado",
  expired: "Expirado",
};

function paymentBadge(status: string | null) {
  if (!status) return <Badge variant="outline">—</Badge>;
  const map: Record<string, { cls: string; Icon: any }> = {
    paid: { cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", Icon: CheckCircle2 },
    pending: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", Icon: Clock },
    failed: { cls: "bg-red-500/15 text-red-400 border-red-500/30", Icon: XCircle },
    expired: { cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", Icon: XCircle },
  };
  const cfg = map[status] ?? { cls: "bg-muted text-foreground", Icon: Clock };
  const Icon = cfg.Icon;
  return (
    <Badge className={`${cfg.cls} rounded-sm`}>
      <Icon className="w-3 h-3 mr-1" />
      {PAYMENT_LABEL[status] ?? status}
    </Badge>
  );
}

export default function PortalOrders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const fetchAll = async () => {
    if (!user?.email) return;
    const { data: client } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("email", user.email)
      .maybeSingle();
    if (!client) {
      setOrders([]);
      return;
    }
    setClientId(client.id);
    setClientName(client.company_name);

    const { data: o } = await supabase
      .from("orders")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    setOrders(o ?? []);

    if (o && o.length) {
      const { data: oi } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", o.map((x) => x.id));
      const byOrder: Record<string, any[]> = {};
      (oi ?? []).forEach((it) => {
        (byOrder[it.order_id] ??= []).push(it);
      });
      setItems(byOrder);
    } else {
      setItems({});
    }
  };

  useEffect(() => {
    if (!loading) fetchAll();
  }, [user, loading]);

  useRealtimeTable({
    table: "orders",
    enabled: !!clientId,
    filter: clientId ? `client_id=eq.${clientId}` : undefined,
    onChange: fetchAll,
  });

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "all" && (o.payment_status ?? "pending") !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!o.order_number?.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [orders, search, statusFilter],
  );

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === "paid");
    const pending = orders.filter((o) => (o.payment_status ?? "pending") === "pending");
    const totalPaid = paid.reduce((s, o) => s + Number(o.total ?? 0), 0);
    return { paidCount: paid.length, pendingCount: pending.length, totalPaid };
  }, [orders]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  if (!user)
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Inicia sesión para ver tus pagos</h2>
        <Button asChild>
          <Link to="/login">Acceder</Link>
        </Button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/portal" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Portal
          </Link>
          <h1 className="text-2xl font-semibold">Mis pagos y tickets</h1>
          {clientName && <p className="text-sm text-muted-foreground">{clientName}</p>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Pedidos pagados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-400">{kpis.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Total pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-500">{moneyFmt.format(kpis.totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar # de pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estatus</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="failed">Rechazados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> {filtered.length} pedido{filtered.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Pedido</th>
                  <th className="text-left px-4 py-2 font-medium">Fecha</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                  <th className="text-left px-4 py-2 font-medium">Pago</th>
                  <th className="text-left px-4 py-2 font-medium">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border/40 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelected(o)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {dateFmt.format(new Date(o.created_at))}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{moneyFmt.format(Number(o.total ?? 0))}</td>
                    <td className="px-4 py-3">{paymentBadge(o.payment_status)}</td>
                    <td className="px-4 py-3">
                      {o.ticket_token ? (
                        <Link
                          to={`/ticket/${o.ticket_token}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                        >
                          <TicketIcon className="w-3 h-3" /> Ver
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No tienes pedidos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detalle */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[460px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">{selected.order_number}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  {paymentBadge(selected.payment_status)}
                  <span className="text-xs text-muted-foreground">
                    {dateFmt.format(new Date(selected.created_at))}
                  </span>
                </div>

                <div className="rounded-md border border-border/60 divide-y divide-border/40">
                  {(items[selected.id] ?? []).map((it) => (
                    <div key={it.id} className="flex justify-between gap-3 px-3 py-2 text-xs">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{it.product_name}</p>
                        <p className="text-muted-foreground">
                          {it.quantity} × {moneyFmt.format(Number(it.unit_price))}
                        </p>
                      </div>
                      <p className="font-medium">
                        {moneyFmt.format(Number(it.subtotal ?? it.quantity * it.unit_price))}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 bg-muted/40 text-sm font-semibold">
                    <span>Total</span>
                    <span>{moneyFmt.format(Number(selected.total ?? 0))}</span>
                  </div>
                </div>

                {selected.paid_at && (
                  <p className="text-xs text-muted-foreground">
                    Pagado el {dateFmt.format(new Date(selected.paid_at))}
                  </p>
                )}

                {selected.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
                    <p className="text-xs">{selected.notes}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                  {selected.ticket_token ? (
                    <Button asChild size="sm">
                      <Link to={`/ticket/${selected.ticket_token}`}>
                        <TicketIcon className="w-4 h-4 mr-2" /> Ver ticket con QR
                      </Link>
                    </Button>
                  ) : selected.payment_status === "pending" ? (
                    <p className="text-xs text-muted-foreground text-center">
                      El ticket se generará automáticamente al confirmarse el pago.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">
                      Sin ticket disponible para este pedido.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
