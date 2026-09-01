import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Timer,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchHealth, healthEndpoint, type HealthResponse } from "@/lib/health";

interface HealthCheckRow {
  id: string;
  checked_at: string;
  source: string | null;
  status: string;
  ok: boolean;
  latency_ms: number | null;
  failed_dependency: string | null;
  correlation_id: string | null;
}

interface IncidentRow {
  id: string;
  dependency: string;
  status: string;
  consecutive_failures: number | null;
  last_message: string | null;
  opened_at: string;
  closed_at: string | null;
}

interface ErrorLogRow {
  id: string;
  created_at: string;
  correlation_id: string;
  kind: string;
  message: string;
  route: string | null;
  status_code: number | null;
}

const fmt = (value: string) => new Date(value).toLocaleString("es-MX");

export default function AdminHealth() {
  const { toast } = useToast();
  const [live, setLive] = useState<HealthResponse | null>(null);
  const [checks, setChecks] = useState<HealthCheckRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [errors, setErrors] = useState<ErrorLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [checkRes, incidentRes, errorRes] = await Promise.all([
      supabase
        .from("service_health_checks")
        .select("id,checked_at,source,status,ok,latency_ms,failed_dependency,correlation_id")
        .gte("checked_at", since)
        .order("checked_at", { ascending: false })
        .limit(200),
      supabase
        .from("service_health_incidents")
        .select("id,dependency,status,consecutive_failures,last_message,opened_at,closed_at")
        .order("opened_at", { ascending: false })
        .limit(20),
      supabase
        .from("app_error_logs")
        .select("id,created_at,correlation_id,kind,message,route,status_code")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setChecks((checkRes.data ?? []) as HealthCheckRow[]);
    setIncidents((incidentRes.data ?? []) as IncidentRow[]);
    setErrors((errorRes.data ?? []) as ErrorLogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    void fetchHealth("ready").then(setLive).catch(() => setLive(null));
  }, [load]);

  const metrics = useMemo(() => {
    const total = checks.length;
    const failures = checks.filter((c) => !c.ok).length;
    const latencies = checks.map((c) => c.latency_ms ?? 0).sort((a, b) => a - b);
    const p95 = latencies.length ? (latencies[Math.floor(latencies.length * 0.95)] ?? 0) : 0;
    const avg = latencies.length
      ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
      : 0;
    return {
      total,
      failures,
      errorRate: total ? (failures / total) * 100 : 0,
      p95,
      avg,
    };
  }, [checks]);

  const runMonitor = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("health-monitor", { body: {} });
    setRunning(false);
    if (error) {
      toast({
        title: "No se pudo ejecutar el monitoreo",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Monitoreo ejecutado",
      description: `Estado: ${data?.status ?? "?"} · latencia ${data?.latency_ms ?? "?"} ms${data?.alerted ? " · alerta enviada" : ""}`,
    });
    void load();
    void fetchHealth("ready").then(setLive).catch(() => setLive(null));
  };

  const openIncidents = incidents.filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salud del servicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Latencia, tasa de fallo, incidentes y errores con ID de correlación.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>Actualizar</span>
          </Button>
          <Button onClick={() => void runMonitor()} disabled={running}>
            <Activity className="h-4 w-4" aria-hidden="true" />
            <span>{running ? "Verificando…" : "Verificar ahora"}</span>
          </Button>
        </div>
      </header>

      <section aria-labelledby="estado-vivo" className="rounded-2xl border border-border bg-card p-6">
        <h2 id="estado-vivo" className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Estado en vivo
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {live?.status === "ok" ? (
            <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
          ) : live?.status === "degraded" ? (
            <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden="true" />
          ) : (
            <XCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
          )}
          <span className="text-lg font-semibold text-foreground">
            {live?.status === "ok"
              ? "Todo operativo"
              : live?.status === "degraded"
                ? "Servicio degradado"
                : "Sin respuesta"}
          </span>
          {live ? (
            <span className="text-sm text-muted-foreground">
              {live.latency_ms} ms · {live.correlation_id}
            </span>
          ) : null}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {(live?.checks ?? []).map((check) => (
            <li
              key={check.name}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                {check.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                )}
                <span className="text-foreground">{check.name}</span>
              </span>
              <span className="text-muted-foreground">{check.latency_ms} ms</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 break-all text-xs text-muted-foreground">
          Endpoints: <code>{healthEndpoint("health")}</code> · <code>{healthEndpoint("ready")}</code>
        </p>
      </section>

      <section aria-labelledby="metricas" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="metricas" className="sr-only">
          Métricas de las últimas 24 horas
        </h2>
        {[
          { label: "Verificaciones (24 h)", value: metrics.total, icon: Activity },
          { label: "Tasa de fallo", value: `${metrics.errorRate.toFixed(2)}%`, icon: TrendingDown },
          { label: "Latencia promedio", value: `${metrics.avg} ms`, icon: Timer },
          { label: "Latencia p95", value: `${metrics.p95} ms`, icon: Timer },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="incidentes">
        <h2 id="incidentes" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Incidentes {openIncidents.length > 0 ? `· ${openIncidents.length} abierto(s)` : ""}
        </h2>
        <ul className="space-y-2">
          {incidents.map((incident) => (
            <li key={incident.id} className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{incident.dependency}</span>
                <Badge variant={incident.status === "open" ? "destructive" : "secondary"}>
                  {incident.status === "open" ? "abierto" : "resuelto"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {fmt(incident.opened_at)}
                {incident.closed_at ? ` → ${fmt(incident.closed_at)}` : ""} ·{" "}
                {incident.consecutive_failures ?? 0} fallas seguidas
              </p>
              {incident.last_message ? (
                <p className="mt-1 text-sm text-muted-foreground">{incident.last_message}</p>
              ) : null}
            </li>
          ))}
          {incidents.length === 0 ? (
            <li className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Sin incidentes registrados.
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="errores">
        <h2 id="errores" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Últimos errores de la app
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3">Ruta</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmt(row.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-foreground">
                    {row.correlation_id}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{row.kind}</Badge>
                    {row.status_code ? (
                      <span className="ml-2 text-xs text-muted-foreground">HTTP {row.status_code}</span>
                    ) : null}
                  </td>
                  <td className="max-w-[24rem] px-4 py-3 text-foreground">{row.message}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.route ?? "—"}</td>
                </tr>
              ))}
              {errors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Sin errores registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
