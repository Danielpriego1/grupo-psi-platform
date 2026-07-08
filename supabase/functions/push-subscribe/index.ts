import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({} as any));
    const action = body.action ?? "subscribe";
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "unsubscribe") {
      const endpoint = body.endpoint;
      if (!endpoint) return json({ error: "missing_endpoint" }, 400);
      await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
      return json({ ok: true });
    }

    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return json({ error: "invalid_subscription" }, 400);
    }
    const row = {
      user_id: userData.user.id,
      endpoint: sub.endpoint as string,
      p256dh: sub.keys.p256dh as string,
      auth: sub.keys.auth as string,
      user_agent: req.headers.get("user-agent") ?? null,
    };
    const { error } = await admin
      .from("push_subscriptions")
      .upsert(row, { onConflict: "endpoint" });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
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
