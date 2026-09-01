import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireRole } from "../_shared/admin-auth.ts";

/**
 * Monitoreo: consulta /ready, calcula tasa de error y latencia, y alerta por
 * correo + push cuando hay fallo sostenido. Anti-spam: una alerta por incidente
 * abierto y un aviso de recuperación al cerrarlo.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const FAILURE_THRESHOLD = 2; // verificaciones fallidas consecutivas antes de alertar
const REALERT_MINUTES = 60; // recordatorio mientras el incidente siga abierto

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireRole(req, ["admin", "superadmin"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status ?? 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 1) Verificar el estado actual
  let status = "down";
  let latency = 0;
  let failedDependency: string | null = "backend";
  let correlationId: string | null = null;
  let detail = "sin respuesta del endpoint /ready";

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/health?mode=ready&source=monitor`, {
      headers: { apikey: ANON_KEY },
    });
    const payload = await res.json();
    status = String(payload.status ?? "down");
    latency = Number(payload.latency_ms ?? 0);
    correlationId = payload.correlation_id ?? null;
    const failed = (payload.checks ?? []).filter((c: { ok: boolean }) => !c.ok);
    failedDependency = failed[0]?.name ?? null;
    detail = failed.length
      ? failed.map((c: { name: string; detail?: string }) => `${c.name}: ${c.detail ?? "falla"}`).join(" · ")
      : "todas las dependencias responden";
  } catch (error) {
    detail = error instanceof Error ? error.message : detail;
  }

  const healthy = status === "ok";
  const dependency = failedDependency ?? "backend";

  // 2) Métricas de las últimas 24 h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("service_health_checks")
    .select("ok,latency_ms,checked_at")
    .gte("checked_at", since)
    .order("checked_at", { ascending: false })
    .limit(500);

  const rows = recent ?? [];
  const errorRate = rows.length ? rows.filter((r) => !r.ok).length / rows.length : 0;
  const latencies = rows.map((r) => r.latency_ms ?? 0).sort((a, b) => a - b);
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] ?? 0 : 0;

  // 3) Incidentes con anti-spam
  const { data: openIncident } = await admin
    .from("service_health_incidents")
    .select("id,consecutive_failures,last_alert_at,dependency")
    .eq("status", "open")
    .maybeSingle();

  let alerted = false;

  if (!healthy) {
    if (openIncident) {
      const failures = (openIncident.consecutive_failures ?? 1) + 1;
      const lastAlert = openIncident.last_alert_at ? new Date(openIncident.last_alert_at).getTime() : 0;
      const shouldRealert = Date.now() - lastAlert > REALERT_MINUTES * 60 * 1000;
      const shouldFirstAlert = failures >= FAILURE_THRESHOLD && !openIncident.last_alert_at;

      if (shouldFirstAlert || shouldRealert) {
        await notify(admin, {
          title: `Servicio con fallas · ${dependency}`,
          body: `${detail} · latencia ${latency} ms`,
          templateData: { status, dependency, detail, latency, errorRate, p95, correlationId },
        });
        alerted = true;
      }

      await admin
        .from("service_health_incidents")
        .update({
          consecutive_failures: failures,
          last_message: detail.slice(0, 500),
          ...(alerted ? { last_alert_at: new Date().toISOString() } : {}),
        })
        .eq("id", openIncident.id);
    } else {
      await admin.from("service_health_incidents").insert({
        dependency,
        status: "open",
        consecutive_failures: 1,
        last_message: detail.slice(0, 500),
      });
    }
  } else if (openIncident) {
    await admin
      .from("service_health_incidents")
      .update({ status: "resolved", closed_at: new Date().toISOString(), last_message: "recuperado" })
      .eq("id", openIncident.id);

    await notify(admin, {
      title: `Servicio recuperado · ${openIncident.dependency}`,
      body: `Todas las dependencias responden · latencia ${latency} ms`,
      templateData: { status: "ok", dependency: openIncident.dependency, detail, latency, errorRate, p95, correlationId },
    });
    alerted = true;
  }

  return json({
    status,
    latency_ms: latency,
    failed_dependency: failedDependency,
    error_rate_24h: Number((errorRate * 100).toFixed(2)),
    p95_latency_ms: p95,
    alerted,
    correlation_id: correlationId,
  });
});

interface NotifyInput {
  title: string;
  body: string;
  templateData: Record<string, unknown>;
}

async function notify(
  admin: ReturnType<typeof createClient>,
  { title, body, templateData }: NotifyInput,
) {
  // Push a los dispositivos de admins
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/push-send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        title,
        body,
        url: "/admin/salud",
        tag: "health",
        kind: "other",
      }),
    });
  } catch (error) {
    console.error("push de salud falló", error);
  }

  // Correo a cada admin
  try {
    const { data: recipients } = await admin.rpc("get_admin_recipient_emails");
    for (const row of (recipients ?? []) as { email: string }[]) {
      await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({
          templateName: "alerta-servicio",
          recipientEmail: row.email,
          templateData: { title, summary: body, ...templateData },
        }),
      });
    }
  } catch (error) {
    console.error("correo de salud falló", error);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
