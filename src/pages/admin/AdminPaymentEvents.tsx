import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, RotateCcw, XCircle, Receipt } from "lucide-react";
import type { PaymentEventKind } from "@/hooks/useCrm";

interface Row {
  id: string;
  opportunity_id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  opportunity: { title: string; stage: string; contact_name: string | null } | null;
}

const META: Record<PaymentEventKind, { label: string; tone: string; Icon: typeof CheckCircle2 }> = {
  paid: { label: "Pagado", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  failed: { label: "Rechazado", tone: "bg-red-500/15 text-red-300 border-red-500/30", Icon: XCircle },
  expired: { label: "Expirado", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30", Icon: Clock },
  refunded: { label: "Reembolso", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30", Icon: RotateCcw },
};

export default function AdminPaymentEvents() {
  const [kind, setKind] = useState<"all" | PaymentEventKind>("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_activities")
        .select("id, opportunity_id, content, metadata, created_at, opportunity:crm_opportunities(title, stage, contact_name)")
        .eq("type", "pago")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const ek = (meta.event_kind as PaymentEventKind) || "paid";
      if (kind !== "all" && ek !== kind) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const order = ((meta.order_number as string) || "").toLowerCase();
        const title = (r.opportunity?.title || "").toLowerCase();
        if (!order.includes(needle) && !title.includes(needle)) return false;
      }
      return true;
    });
  }, [data, kind, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { paid: 0, failed: 0, expired: 0, refunded: 0 };
    (data ?? []).forEach((r) => {
      const ek = ((r.metadata as any)?.event_kind as string) || "paid";
      c[ek] = (c[ek] ?? 0) + 1;
    });
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Eventos de pago</h1>
          <p className="text-sm text-muted-foreground">
            Bitácora unificada de pagos confirmados, fallidos, expirados y reembolsos ligados al CRM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(META) as PaymentEventKind[]).map((k) => {
          const cfg = META[k];
          return (
            <div key={k} className={`rounded-lg border p-3 ${cfg.tone}`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <cfg.Icon className="w-4 h-4" />
                {cfg.label}
              </div>
              <div className="text-2xl font-bold mt-1">{counts[k] ?? 0}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por número de orden o título…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-md"
        />
        <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="failed">Rechazados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
            <SelectItem value="refunded">Reembolsos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2">Evento</th>
              <th className="text-left px-3 py-2">Orden</th>
              <th className="text-left px-3 py-2">Oportunidad</th>
              <th className="text-right px-3 py-2">Monto</th>
              <th className="text-left px-3 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Cargando…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Sin eventos.</td></tr>
            )}
            {filtered.map((r) => {
              const meta = (r.metadata ?? {}) as Record<string, unknown>;
              const ek = (meta.event_kind as PaymentEventKind) || "paid";
              const cfg = META[ek] ?? META.paid;
              const amount = typeof meta.amount === "number" ? meta.amount : null;
              const currency = (meta.currency as string) || "MXN";
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/10">
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={cfg.tone}>
                      <cfg.Icon className="w-3 h-3 mr-1" />{cfg.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {(meta.order_number as string) || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.opportunity?.title || <span className="text-muted-foreground">—</span>}
                    {r.opportunity?.contact_name && (
                      <div className="text-[11px] text-muted-foreground">{r.opportunity.contact_name}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {amount != null ? `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${currency}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "PPp", { locale: es })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
