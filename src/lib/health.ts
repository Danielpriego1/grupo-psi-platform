import { getCorrelationId } from "@/lib/errorReporting";

/** Cliente de los endpoints /health y /ready del backend. */

export type HealthState = "ok" | "degraded" | "down";

export interface HealthCheckItem {
  name: string;
  ok: boolean;
  latency_ms: number;
  detail?: string;
}

export interface HealthResponse {
  status: HealthState;
  mode: "health" | "ready";
  checks: HealthCheckItem[];
  latency_ms: number;
  correlation_id: string;
  version: string;
  at: string;
}

const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export function healthEndpoint(mode: "health" | "ready"): string {
  return `${BASE_URL ?? ""}/functions/v1/health?mode=${mode}`;
}

// El ID viaja como query param: un header propio dispararía preflight CORS.
function endpointWithCorrelation(mode: "health" | "ready"): string {
  return `${healthEndpoint(mode)}&cid=${encodeURIComponent(getCorrelationId())}`;
}

export async function fetchHealth(mode: "health" | "ready"): Promise<HealthResponse> {
  const started = performance.now();
  const response = await fetch(endpointWithCorrelation(mode), {
    method: "GET",
    headers: { apikey: ANON_KEY ?? "" },
  });

  const elapsed = Math.round(performance.now() - started);
  const payload = (await response.json().catch(() => null)) as HealthResponse | null;

  if (!payload) {
    return {
      status: "down",
      mode,
      checks: [
        {
          name: "api",
          ok: false,
          latency_ms: elapsed,
          detail: `Respuesta no válida (HTTP ${response.status})`,
        },
      ],
      latency_ms: elapsed,
      correlation_id: getCorrelationId(),
      version: "desconocida",
      at: new Date().toISOString(),
    };
  }

  return payload;
}
