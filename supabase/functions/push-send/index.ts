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

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_ROLE);
    const { data: allSubs, error } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth,kinds,sound,priority");
    if (error) return json({ error: error.message }, 500);

    // Filter by user preferences (kinds). "other" always delivers.
    const subs = (allSubs ?? []).filter((s: any) => {
      if (kind === "other") return true;
      const kinds: string[] = Array.isArray(s.kinds) ? s.kinds : ["order", "quote", "maintenance"];
      return kinds.includes(kind);
    });

    let sent = 0, removed = 0, failed = 0;
    const deliveredIds: string[] = [];
    await Promise.all(subs.map(async (s: any) => {
      const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      const payload = JSON.stringify({
        title,
        body: bodyText,
        url,
        tag,
        silent: s.sound === false || s.priority === "silent",
        priority: s.priority ?? "normal",
        data: body.data ?? {},
      });
      try {
        await webpush.sendNotification(sub as any, payload, {
          TTL: 60,
          urgency: s.priority === "high" ? "high" : s.priority === "silent" ? "low" : "normal",
        });
        sent++;
        deliveredIds.push(s.id);
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

    if (deliveredIds.length) {
      await admin
        .from("push_subscriptions")
        .update({ last_delivered_at: new Date().toISOString() })
        .in("id", deliveredIds);
    }

    const total = subs.length;
    const status =
      total === 0 ? "no_targets" : failed === total ? "failed" : failed > 0 ? "partial" : "sent";

    try {
      await admin.from("notification_events").insert({
        kind, title, body: bodyText, url, tag, ref_number: refNumber,
        sent, removed, failed, total_targets: total, status,
      });
    } catch (_) { /* best-effort */ }

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
