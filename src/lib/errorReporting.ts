import { supabase } from "@/integrations/supabase/client";

/**
 * Diagnóstico de la app: ID de correlación por sesión, bitácora local de los
 * últimos errores y envío estructurado a la base de datos para que un admin
 * pueda rastrear un 500 o un fallo de red desde el panel.
 */

const SESSION_KEY = "psi_correlation_id";
const LOG_KEY = "psi_error_log";
const MAX_LOCAL_ENTRIES = 20;

export type AppErrorKind = "render" | "network" | "function" | "http" | "manual";

export interface AppErrorEntry {
  correlationId: string;
  kind: AppErrorKind;
  message: string;
  route: string;
  at: string;
  statusCode?: number;
  durationMs?: number;
  detail?: Record<string, unknown>;
}

function randomBlock(): string {
  const bytes = new Uint8Array(2);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 256);
    bytes[1] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** ID legible para dictar por teléfono o pegar en un ticket: PSI-4F2A-8C10 */
export function newCorrelationId(): string {
  return `PSI-${randomBlock()}-${randomBlock()}`;
}

/** ID estable durante toda la sesión del navegador. */
export function getCorrelationId(): string {
  if (typeof sessionStorage === "undefined") return newCorrelationId();
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = newCorrelationId();
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return newCorrelationId();
  }
}

export function getLocalErrorLog(): AppErrorEntry[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(LOG_KEY);
    const parsed = raw ? (JSON.parse(raw) as AppErrorEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearLocalErrorLog(): void {
  try {
    sessionStorage?.removeItem(LOG_KEY);
  } catch {
    /* sin almacenamiento disponible */
  }
}

function pushLocal(entry: AppErrorEntry): void {
  try {
    const next = [entry, ...getLocalErrorLog()].slice(0, MAX_LOCAL_ENTRIES);
    sessionStorage?.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export interface ReportOptions {
  kind?: AppErrorKind;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  detail?: Record<string, unknown>;
}

/**
 * Registra un error: guarda copia local (para la pantalla de diagnóstico) y lo
 * envía a `app_error_logs`. Nunca lanza: el diagnóstico jamás debe romper la app.
 */
export async function reportAppError(
  error: unknown,
  options: ReportOptions = {},
): Promise<string> {
  const correlationId = getCorrelationId();
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Error desconocido";
  const route =
    options.route ??
    (typeof window !== "undefined" ? window.location.pathname : "desconocida");

  const entry: AppErrorEntry = {
    correlationId,
    kind: options.kind ?? "render",
    message: message.slice(0, 2000),
    route: route.slice(0, 300),
    at: new Date().toISOString(),
    statusCode: options.statusCode,
    durationMs: options.durationMs,
    detail: options.detail,
  };
  pushLocal(entry);

  try {
    const stack = error instanceof Error ? error.stack?.slice(0, 4000) : undefined;
    await supabase.from("app_error_logs").insert({
      correlation_id: correlationId,
      kind: entry.kind,
      route: entry.route,
      message: entry.message,
      status_code: options.statusCode ?? null,
      duration_ms: options.durationMs ?? null,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      detail: { ...(options.detail ?? {}), stack },
    });
  } catch {
    /* si el backend está caído, la copia local sigue disponible */
  }

  return correlationId;
}

/** Contexto que mostramos al usuario en la pantalla de error. */
export function getDiagnosticContext() {
  return {
    correlationId: getCorrelationId(),
    route: typeof window !== "undefined" ? window.location.pathname : "",
    at: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    viewport:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : "",
  };
}
