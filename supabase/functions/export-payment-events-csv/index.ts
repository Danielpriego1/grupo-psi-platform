// Daily CSV export of payment events. Uploads to admin-reports bucket and
// emails admins/superadmins a signed download link.
//
// Auth: admin/superadmin user JWT OR service-role bearer (used by pg_cron).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ActivityRow {
  id: string;
  content: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  opportunity: { title: string | null; stage: string | null; contact_name: string | null } | null;
}

const LABEL: Record<string, string> = {
  paid: "Pagado",
  failed: "Rechazado",
  expired: "Expirado",
  refunded: "Reembolso",
};

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(rows: ActivityRow[]): string {
  const header = [
    "fecha", "tipo", "orden", "oportunidad", "contacto",
    "monto", "moneda", "payment_intent", "stage_oportunidad",
  ];
  const body = rows.map((r) => {
    const m = (r.metadata ?? {}) as Record<string, unknown>;
    const ek = (m.event_kind as string) || "paid";
    return [
      new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19),
      LABEL[ek] ?? ek,
      (m.order_number as string) ?? "",
      r.opportunity?.title ?? "",
      r.opportunity?.contact_name ?? "",
      typeof m.amount === "number" ? (m.amount as number).toFixed(2) : "",
      (m.currency as string) ?? "",
      (m.payment_intent as string) ?? "",
      r.opportunity?.stage ?? "",
    ];
  });
  return "\uFEFF" + [header, ...body].map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const auth = await requireRole(req, ["admin", "superadmin"]);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ error: auth.error ?? "unauthorized" }),
      { status: auth.status ?? 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: { since?: string; until?: string; recipients?: string[] } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const untilDate = body.until ? new Date(body.until) : new Date();
  const sinceDate = body.since ? new Date(body.since) : new Date(untilDate.getTime() - 24 * 60 * 60 * 1000);

  // Pull payment events in range
  const { data: rows, error: qErr } = await supabase
    .from("crm_activities")
    .select("id, content, created_at, metadata, opportunity:crm_opportunities(title, stage, contact_name)")
    .eq("type", "pago")
    .gte("created_at", sinceDate.toISOString())
    .lte("created_at", untilDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(10000);
  if (qErr) {
    return new Response(JSON.stringify({ error: qErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const activities = (rows ?? []) as unknown as ActivityRow[];

  // Counters by kind
  const counts = { paid: 0, failed: 0, expired: 0, refunded: 0 } as Record<string, number>;
  for (const a of activities) {
    const ek = ((a.metadata as Record<string, unknown> | null)?.event_kind as string) || "paid";
    counts[ek] = (counts[ek] ?? 0) + 1;
  }

  // Build & upload CSV
  const csv = buildCsv(activities);
  const reportDate = untilDate.toISOString().slice(0, 10);
  const path = `payment-events/${reportDate}/payment-events-${untilDate.getTime()}.csv`;
  const { error: upErr } = await supabase.storage
    .from("admin-reports")
    .upload(path, new Blob([csv], { type: "text/csv;charset=utf-8;" }), {
      contentType: "text/csv; charset=utf-8",
      upsert: true,
    });
  if (upErr) {
    return new Response(JSON.stringify({ error: `upload_failed: ${upErr.message}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 7-day signed URL
  const { data: signed, error: sErr } = await supabase.storage
    .from("admin-reports")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (sErr || !signed) {
    return new Response(JSON.stringify({ error: `sign_failed: ${sErr?.message}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve recipients
  let recipients: string[] = Array.isArray(body.recipients) ? body.recipients.filter(Boolean) : [];
  if (recipients.length === 0) {
    const { data: emails } = await supabase.rpc("get_admin_recipient_emails");
    recipients = (emails ?? []).map((r: { email: string }) => r.email).filter(Boolean);
  }

  // Send emails (one per recipient, idempotency key per date+recipient)
  const sendResults: Array<{ email: string; ok: boolean; error?: string }> = [];
  const rangeLabel = `${sinceDate.toISOString().slice(0, 16).replace("T", " ")} – ${untilDate.toISOString().slice(0, 16).replace("T", " ")} UTC`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";

  for (const email of recipients) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
        },
        body: JSON.stringify({
          templateName: "reporte-pagos-diario",
          recipientEmail: email,
          idempotencyKey: `payment-events-${reportDate}-${email}`,
          templateData: {
            reportDate,
            rangeLabel,
            total: activities.length,
            paid: counts.paid ?? 0,
            failed: counts.failed ?? 0,
            expired: counts.expired ?? 0,
            refunded: counts.refunded ?? 0,
            downloadUrl: signed.signedUrl,
            expiresAt,
          },
        }),
      });
      const ok = res.ok;
      const text = await res.text();
      sendResults.push({ email, ok, error: ok ? undefined : text.slice(0, 200) });
    } catch (e) {
      sendResults.push({ email, ok: false, error: (e as Error).message });
    }
  }

  return new Response(
    JSON.stringify({
      report_date: reportDate,
      total: activities.length,
      counts,
      storage_path: path,
      download_url: signed.signedUrl,
      recipients: sendResults,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
