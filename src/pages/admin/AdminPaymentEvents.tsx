import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Receipt,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import type { PaymentEventKind } from "@/hooks/useCrm";
import { toast } from "sonner";

interface Row {
  id: string;
  opportunity_id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  opportunity: { title: string; stage: string; contact_name: string | null } | null;
}

type SortKey = "created_at" | "amount" | "event_kind";
type SortDir = "asc" | "desc";

const META: Record<PaymentEventKind, { label: string; tone: string; Icon: typeof CheckCircle2 }> = {
  paid: { label: "Pagado", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  failed: { label: "Rechazado", tone: "bg-red-500/15 text-red-300 border-red-500/30", Icon: XCircle },
  expired: { label: "Expirado", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30", Icon: Clock },
  refunded: { label: "Reembolso", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30", Icon: RotateCcw },
};

const PAGE_SIZES = [10, 25, 50, 100];

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ReconcileResult {
  scanned: number;
  fixed: number;
  dry_run: boolean;
  mismatches: Array<{
    order_number: string | null;
    event_kind: string;
    action: string;
    detail?: string;
  }>;
}

export default function AdminPaymentEvents() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"all" | PaymentEventKind>("all");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [sortBy, setSortBy] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reconciliation panel state
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const toLocalInput = (d: Date) => {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  };
  const [recSince, setRecSince] = useState(toLocalInput(yesterday));
  const [recUntil, setRecUntil] = useState(toLocalInput(now));
  const [dryRun, setDryRun] = useState(true);
  const [recRunning, setRecRunning] = useState(false);
  const [recResult, setRecResult] = useState<ReconcileResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-events", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("crm_activities")
        .select(
          "id, opportunity_id, content, metadata, created_at, opportunity:crm_opportunities(title, stage, contact_name)"
        )
        .eq("type", "pago")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    const list = (data ?? []).filter((r) => {
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

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const ma = (a.metadata ?? {}) as Record<string, unknown>;
      const mb = (b.metadata ?? {}) as Record<string, unknown>;
      if (sortBy === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      if (sortBy === "amount") {
        const aa = typeof ma.amount === "number" ? (ma.amount as number) : -Infinity;
        const bb = typeof mb.amount === "number" ? (mb.amount as number) : -Infinity;
        return (aa - bb) * dir;
      }
      const ea = ((ma.event_kind as string) || "paid");
      const eb = ((mb.event_kind as string) || "paid");
      return ea.localeCompare(eb) * dir;
    });
    return list;
  }, [data, kind, q, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [kind, q, dateFrom, dateTo, sortBy, sortDir, pageSize]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const counts = useMemo(() => {
    const c: Record<string, number> = { paid: 0, failed: 0, expired: 0, refunded: 0 };
    (data ?? []).forEach((r) => {
      const ek = ((r.metadata as Record<string, unknown> | null)?.event_kind as string) || "paid";
      c[ek] = (c[ek] ?? 0) + 1;
    });
    return c;
  }, [data]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info("No hay eventos para exportar con los filtros actuales.");
      return;
    }
    const header = [
      "fecha",
      "tipo",
      "orden",
      "oportunidad",
      "contacto",
      "monto",
      "moneda",
      "payment_intent",
      "stage_oportunidad",
    ];
    const body = filtered.map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const ek = (meta.event_kind as PaymentEventKind) || "paid";
      return [
        format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss"),
        META[ek]?.label ?? ek,
        (meta.order_number as string) ?? "",
        r.opportunity?.title ?? "",
        r.opportunity?.contact_name ?? "",
        typeof meta.amount === "number" ? (meta.amount as number).toFixed(2) : "",
        (meta.currency as string) ?? "",
        (meta.payment_intent as string) ?? "",
        r.opportunity?.stage ?? "",
      ];
    });
    const stamp = format(new Date(), "yyyyMMdd-HHmm");
    downloadCsv(`payment-events-${stamp}.csv`, [header, ...body]);
    toast.success(`Exportados ${filtered.length} eventos.`);
  };

  const runReconcile = async () => {
    setRecRunning(true);
    setRecResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-reconcile", {
        body: {
          since: new Date(recSince).toISOString(),
          until: new Date(recUntil).toISOString(),
          dry_run: dryRun,
        },
      });
      if (error) throw error;
      setRecResult(data as ReconcileResult);
      toast.success(
        dryRun
          ? `Escaneo completo: ${(data as ReconcileResult).mismatches.length} discrepancias`
          : `Reconciliación aplicada: ${(data as ReconcileResult).fixed} corregidos`
      );
      if (!dryRun) qc.invalidateQueries({ queryKey: ["admin-payment-events"] });
    } catch (err) {
      toast.error("Reconciliación falló: " + (err as Error).message);
    } finally {
      setRecRunning(false);
    }
  };

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

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Buscar</Label>
          <Input
            placeholder="Número de orden o título…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
              <SelectItem value="failed">Rechazados</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
              <SelectItem value="refunded">Reembolsos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> CSV
        </Button>
      </div>

      <Collapsible className="rounded-lg border border-border bg-muted/10">
        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Reconciliación Stripe ↔ CRM</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Compara sesiones y cargos de Stripe en el rango contra órdenes y oportunidades del CRM,
            detecta eventos faltantes y los corrige (si desactivas <em>Dry run</em>).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs">Desde</Label>
              <Input
                type="datetime-local"
                value={recSince}
                onChange={(e) => setRecSince(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input
                type="datetime-local"
                value={recUntil}
                onChange={(e) => setRecUntil(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              <Label htmlFor="dry-run" className="text-sm">
                Dry run (solo reporta)
              </Label>
            </div>
            <Button onClick={runReconcile} disabled={recRunning}>
              {recRunning ? "Ejecutando…" : "Ejecutar"}
            </Button>
          </div>
          {recResult && (
            <div className="rounded-md border border-border bg-background/50 p-3 space-y-2">
              <div className="flex gap-4 text-sm">
                <span>Escaneados: <strong>{recResult.scanned}</strong></span>
                <span>Discrepancias: <strong>{recResult.mismatches.length}</strong></span>
                <span>Corregidos: <strong>{recResult.fixed}</strong></span>
                {recResult.dry_run && (
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                    Dry run
                  </Badge>
                )}
              </div>
              {recResult.mismatches.length > 0 && (
                <div className="max-h-48 overflow-auto text-xs">
                  <table className="w-full">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="text-left py-1 pr-2">Orden</th>
                        <th className="text-left py-1 pr-2">Tipo</th>
                        <th className="text-left py-1 pr-2">Acción</th>
                        <th className="text-left py-1">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recResult.mismatches.map((m, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-1 pr-2 font-mono">{m.order_number ?? "—"}</td>
                          <td className="py-1 pr-2">{m.event_kind}</td>
                          <td className="py-1 pr-2">{m.action}</td>
                          <td className="py-1 text-muted-foreground">{m.detail ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2">
                <button onClick={() => toggleSort("event_kind")} className="hover:text-foreground">
                  Evento {sortIcon("event_kind")}
                </button>
              </th>
              <th className="text-left px-3 py-2">Orden</th>
              <th className="text-left px-3 py-2">Oportunidad</th>
              <th className="text-right px-3 py-2">
                <button onClick={() => toggleSort("amount")} className="hover:text-foreground">
                  Monto {sortIcon("amount")}
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => toggleSort("created_at")} className="hover:text-foreground">
                  Fecha {sortIcon("created_at")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Sin eventos.
                </td>
              </tr>
            )}
            {pageRows.map((r) => {
              const meta = (r.metadata ?? {}) as Record<string, unknown>;
              const ek = (meta.event_kind as PaymentEventKind) || "paid";
              const cfg = META[ek] ?? META.paid;
              const amount = typeof meta.amount === "number" ? meta.amount : null;
              const currency = (meta.currency as string) || "MXN";
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/10">
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={cfg.tone}>
                      <cfg.Icon className="w-3 h-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {(meta.order_number as string) || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.opportunity?.title || <span className="text-muted-foreground">—</span>}
                    {r.opportunity?.contact_name && (
                      <div className="text-[11px] text-muted-foreground">
                        {r.opportunity.contact_name}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {amount != null
                      ? `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${currency}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "PPp", { locale: es })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 border-t border-border bg-muted/10 text-xs">
          <div className="text-muted-foreground">
            {total === 0
              ? "Sin resultados"
              : `Mostrando ${start + 1}–${Math.min(start + pageSize, total)} de ${total}`}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2">
                {currentPage} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
