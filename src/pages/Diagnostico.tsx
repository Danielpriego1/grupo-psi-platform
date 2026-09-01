import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchHealth, type HealthResponse, type HealthState } from "@/lib/health";
import {
  getDiagnosticContext,
  getLocalErrorLog,
  clearLocalErrorLog,
  type AppErrorEntry,
} from "@/lib/errorReporting";

const STATE_LABEL: Record<HealthState, string> = {
  ok: "Todo operativo",
  degraded: "Servicio degradado",
  down: "Servicio caído",
};

function StatusIcon({ ok, className }: { ok: boolean | null; className?: string }) {
  if (ok === null)
    return <Activity className={className} aria-hidden="true" />;
  return ok ? (
    <CheckCircle2 className={className} aria-hidden="true" />
  ) : (
    <XCircle className={className} aria-hidden="true" />
  );
}

export default function Diagnostico() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localErrors, setLocalErrors] = useState<AppErrorEntry[]>([]);
  const context = getDiagnosticContext();

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await fetchHealth("ready"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo contactar al backend");
      setHealth(null);
    } finally {
      setLoading(false);
      setLocalErrors(getLocalErrorLog());
    }
  }, []);

  useEffect(() => {
    document.title = "Diagnóstico del servicio | Grupo PSI";
    void run();
  }, [run]);

  const copyContext = async () => {
    const text = [
      `ID de correlación: ${context.correlationId}`,
      `Ruta: ${context.route}`,
      `Fecha: ${context.at}`,
      `Pantalla: ${context.viewport}`,
      `Estado backend: ${health?.status ?? "sin respuesta"}`,
      ...(health?.checks ?? []).map(
        (c) => `- ${c.name}: ${c.ok ? "ok" : "falla"} (${c.latency_ms} ms)${c.detail ? ` — ${c.detail}` : ""}`,
      ),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* portapapeles no disponible */
    }
  };

  const overall: HealthState = health?.status ?? "down";
  const overallTone =
    overall === "ok"
      ? "text-primary"
      : overall === "degraded"
        ? "text-amber-500"
        : "text-destructive";

  return (
    <main className="min-h-dvh bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Continuidad operativa
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Diagnóstico del servicio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verificación en vivo de API, base de datos, almacenamiento y funciones.
          </p>
        </header>

        <section
          aria-labelledby="estado-general"
          className="mb-6 rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {overall === "degraded" ? (
                <AlertTriangle className={`h-6 w-6 ${overallTone}`} aria-hidden="true" />
              ) : (
                <StatusIcon ok={overall === "ok"} className={`h-6 w-6 ${overallTone}`} />
              )}
              <div>
                <h2 id="estado-general" className="text-lg font-semibold text-foreground">
                  {loading ? "Verificando…" : STATE_LABEL[overall]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {health
                    ? `Respuesta total ${health.latency_ms} ms · versión ${health.version}`
                    : (error ?? "Sin respuesta del backend")}
                </p>
              </div>
            </div>
            <Button onClick={() => void run()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>Volver a verificar</span>
            </Button>
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {loading ? "Verificando servicios" : STATE_LABEL[overall]}
          </p>
        </section>

        <section aria-labelledby="dependencias" className="mb-6">
          <h2 id="dependencias" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Dependencias
          </h2>
          <ul className="space-y-2">
            {(health?.checks ?? []).map((check) => (
              <li
                key={check.name}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <StatusIcon
                    ok={check.ok}
                    className={`h-5 w-5 ${check.ok ? "text-primary" : "text-destructive"}`}
                  />
                  <span className="font-medium text-foreground">{check.name}</span>
                </span>
                <span className="text-right text-sm text-muted-foreground">
                  {check.latency_ms} ms
                  {check.detail ? <span className="block text-xs">{check.detail}</span> : null}
                </span>
              </li>
            ))}
            {!loading && (health?.checks ?? []).length === 0 ? (
              <li className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                Sin datos de dependencias.
              </li>
            ) : null}
          </ul>
        </section>

        <section
          aria-labelledby="correlacion"
          className="mb-6 rounded-2xl border border-border bg-muted/40 p-6"
        >
          <h2 id="correlacion" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            ID de correlación de esta sesión
          </h2>
          <p className="mt-2 font-mono text-xl font-semibold text-foreground">
            {context.correlationId}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cítalo al reportar un error 500: permite rastrear la petición exacta en
            la bitácora del panel.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void copyContext()}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>{copied ? "Copiado" : "Copiar diagnóstico"}</span>
            </Button>
            <Button variant="ghost" asChild>
              <a href="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Ir al inicio</span>
              </a>
            </Button>
          </div>
        </section>

        <section aria-labelledby="errores-locales">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="errores-locales" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Errores de esta sesión ({localErrors.length})
            </h2>
            {localErrors.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearLocalErrorLog();
                  setLocalErrors([]);
                }}
              >
                Limpiar
              </Button>
            ) : null}
          </div>
          <ul className="space-y-2">
            {localErrors.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <p className="font-medium text-foreground">{entry.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.kind} · {entry.route} · {new Date(entry.at).toLocaleString("es-MX")}
                  {entry.statusCode ? ` · HTTP ${entry.statusCode}` : ""}
                </p>
              </li>
            ))}
            {localErrors.length === 0 ? (
              <li className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                Sin errores registrados en esta sesión.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </main>
  );
}
