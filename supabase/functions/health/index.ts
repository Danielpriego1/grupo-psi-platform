import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Endpoints de salud del backend.
 *   GET /health?mode=health  -> liveness: la función responde (sin dependencias)
 *   GET /health?mode=ready   -> readiness: base de datos, storage y funciones reales
 *
 * 200 = ok/degradado leve, 503 = no listo. No expone datos sensibles.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERSION = Deno.env.get("APP_VERSION") ?? "psi-1";

interface CheckItem {
  name: string;
  ok: boolean;
  latency_ms: number;
  detail?: string;
}

function newCorrelationId(): string {
  const block = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(2)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  return `PSI-${block()}-${block()}`;
}

async function timed(
  name: string,
  run: () => Promise<void>,
): Promise<CheckItem> {
  const started = Date.now();
  try {
    await run();
    return { name, ok: true, latency_ms: Date.now() - started };
  } catch (error) {
    return {
      name,
      ok: false,
      latency_ms: Date.now() - started,
      detail: error instanceof Error ? error.message.slice(0, 200) : "error desconocido",
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const modeParam = url.searchParams.get("mode") ?? (url.pathname.endsWith("/ready") ? "ready" : "health");
  const mode: "health" | "ready" = modeParam === "ready" ? "ready" : "health";
  const correlationId =
    url.searchParams.get("cid") ?? req.headers.get("x-psi-correlation-id") ?? newCorrelationId();
  const started = Date.now();

  if (mode === "health") {
    return json(
      {
        status: "ok",
        mode,
        checks: [{ name: "api", ok: true, latency_ms: 0 }],
        latency_ms: Date.now() - started,
        correlation_id: correlationId,
        version: VERSION,
        at: new Date().toISOString(),
      },
      200,
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const checks: CheckItem[] = [];
  checks.push(
    await timed("base de datos", async () => {
      const { error } = await admin
        .from("service_offerings")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
    }),
  );
  checks.push(
    await timed("storage", async () => {
      const { error } = await admin.storage.from("product-images").list("", { limit: 1 });
      if (error) throw new Error(error.message);
    }),
  );
  checks.push(
    await timed("auth", async () => {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.text();
    }),
  );
  checks.push(
    await timed("funciones", async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/push-public-key`, {
        headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.text();
    }),
  );

  const failed = checks.filter((c) => !c.ok);
  const status = failed.length === 0 ? "ok" : failed.length === checks.length ? "down" : "degraded";
  const latency = Date.now() - started;

  // Toda verificación se registra: el panel y las alertas leen esta tabla.
  try {
    await admin.from("service_health_checks").insert({
      source: url.searchParams.get("source") ?? "ready-endpoint",
      status,
      ok: failed.length === 0,
      latency_ms: latency,
      failed_dependency: failed[0]?.name ?? null,
      correlation_id: correlationId,
      checks,
    });
  } catch (error) {
    console.error("no se pudo registrar la verificación", error);
  }

  return json(
    {
      status,
      mode,
      checks,
      latency_ms: latency,
      correlation_id: correlationId,
      version: VERSION,
      at: new Date().toISOString(),
    },
    status === "down" ? 503 : 200,
  );
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
