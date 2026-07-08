import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:daniel@grupopsi.com";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TRIGGER_SECRET = Deno.env.get("PUSH_TRIGGER_SECRET") ?? "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Auth: service role bearer OR trigger secret header
    const auth = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const trig = req.headers.get("x-psi-push-key") ?? "";
    if (auth !== SERVICE_ROLE && (TRIGGER_SECRET === "" || trig !== TRIGGER_SECRET)) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({} as any));
    const title = String(body.title ?? "Grupo PSI");
    const bodyText = String(body.body ?? "");
    const url = String(body.url ?? "/admin");
    const tag = String(body.tag ?? "psi-notif");
    const kind = String(body.kind ?? body.tag ?? "other");
    const refNumber = body.ref_number ? String(body.ref_number) : null;
    const payload = JSON.stringify({ title, body: bodyText, url, tag, data: body.data ?? {} });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_ROLE);
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth");
    if (error) return json({ error: error.message }, 500);

    let sent = 0, removed = 0, failed = 0;
    await Promise.all((subs ?? []).map(async (s) => {
      const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(sub as any, payload, { TTL: 60 });
        sent++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          failed++;
        }
      }
    }));

    const total = subs?.length ?? 0;
    const status =
      total === 0 ? "no_targets" : failed === total ? "failed" : failed > 0 ? "partial" : "sent";

    try {
      await admin.from("notification_events").insert({
        kind,
        title,
        body: bodyText,
        url,
        tag,
        ref_number: refNumber,
        sent,
        removed,
        failed,
        total_targets: total,
        status,
      });
    } catch (_) { /* logging is best-effort */ }

    return json({ ok: true, sent, removed, failed, total, status });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
