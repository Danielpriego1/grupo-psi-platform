import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Mismatch {
  order_number: string | null;
  event_kind: string;
  action: string;
  detail?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return new Response("STRIPE_SECRET_KEY no configurada", { status: 500, headers: corsHeaders });

  // Auth: require admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: { since?: string; until?: string; dry_run?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const untilMs = body.until ? new Date(body.until).getTime() : Date.now();
  const sinceMs = body.since ? new Date(body.since).getTime() : untilMs - 24 * 60 * 60 * 1000;
  const dryRun = body.dry_run ?? true;
  const since = Math.floor(sinceMs / 1000);
  const until = Math.floor(untilMs / 1000);

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const mismatches: Mismatch[] = [];
  let scanned = 0;
  let fixed = 0;

  const resolveOpportunityId = async (
    metaOppId: string | null,
    orderNumber: string | null,
  ): Promise<string | null> => {
    if (metaOppId) return metaOppId;
    if (!orderNumber) return null;
    const { data } = await supabase
      .from("crm_opportunities")
      .select("id")
      .eq("source_ref", orderNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  };

  const hasActivityForEvent = async (oppId: string, eventId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("crm_activities")
      .select("id, metadata")
      .eq("opportunity_id", oppId)
      .eq("type", "pago")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []).some((a) => {
      const m = (a.metadata ?? {}) as Record<string, unknown>;
      return m.stripe_event_id === eventId || m.stripe_session_id === eventId || m.charge_id === eventId;
    });
  };

  const logCrmActivity = async (oppId: string, content: string, metadata: Record<string, unknown>) => {
    const { error } = await supabase.from("crm_activities").insert({
      opportunity_id: oppId,
      type: "pago",
      content,
      created_by_sora: true,
      metadata: { ...metadata, reconciled: true, source: "reconcile" },
    });
    if (error) console.error("activity insert error:", error.message);
  };

  // --- 1) Checkout sessions ----------------------------------------------------
  try {
    for await (const session of stripe.checkout.sessions.list({
      created: { gte: since, lte: until },
      limit: 100,
      expand: ["data.payment_intent"],
    })) {
      scanned++;
      const orderNumber = (session.metadata?.order_number as string) ?? null;
      const orderId = (session.metadata?.order_id as string) ?? null;
      const metaOppId = (session.metadata?.opportunity_id as string) ?? null;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      // Find order
      let order: { id: string; order_number: string | null; payment_status: string | null } | null = null;
      if (orderId) {
        const { data } = await supabase.from("orders").select("id, order_number, payment_status").eq("id", orderId).maybeSingle();
        order = data ?? null;
      }
      if (!order && orderNumber) {
        const { data } = await supabase.from("orders").select("id, order_number, payment_status").eq("order_number", orderNumber).maybeSingle();
        order = data ?? null;
      }
      if (!order) {
        const { data } = await supabase.from("orders").select("id, order_number, payment_status").eq("stripe_session_id", session.id).maybeSingle();
        order = data ?? null;
      }
      if (!order) {
        mismatches.push({ order_number: orderNumber, event_kind: session.status ?? "unknown", action: "skip", detail: `Sin orden local para session ${session.id}` });
        continue;
      }

      const effectiveOrderNumber = order.order_number ?? orderNumber;

      if (session.status === "complete" && session.payment_status === "paid") {
        if (order.payment_status !== "paid") {
          mismatches.push({
            order_number: effectiveOrderNumber,
            event_kind: "paid",
            action: dryRun ? "pending" : "fixed",
            detail: `Orden estaba en ${order.payment_status ?? "sin estado"}`,
          });
          if (!dryRun) {
            await supabase
              .from("orders")
              .update({
                status: "confirmed",
                payment_status: "paid",
                stripe_session_id: session.id,
                stripe_payment_intent: paymentIntentId,
                paid_at: new Date(((session.created ?? 0) * 1000) || Date.now()).toISOString(),
                ticket_token: crypto.randomUUID(),
              })
              .eq("id", order.id);

            const oppId = await resolveOpportunityId(metaOppId, effectiveOrderNumber);
            if (oppId) {
              const amount = session.amount_total ? session.amount_total / 100 : null;
              const currency = (session.currency || "mxn").toUpperCase();
              await supabase
                .from("crm_opportunities")
                .update({
                  stage: "ganado",
                  won_amount: amount,
                  closed_at: new Date().toISOString(),
                  needs_human_escalation: false,
                })
                .eq("id", oppId);
              if (!(await hasActivityForEvent(oppId, session.id))) {
                await logCrmActivity(
                  oppId,
                  `✅ Pago confirmado (reconciliación) — Orden ${effectiveOrderNumber ?? session.id}`,
                  {
                    event_kind: "paid",
                    order_number: effectiveOrderNumber,
                    amount,
                    currency,
                    stripe_session_id: session.id,
                    payment_intent: paymentIntentId,
                  },
                );
              }
            }
            fixed++;
          }
        }
      } else if (session.status === "expired") {
        if (order.payment_status !== "expired" && order.payment_status !== "paid") {
          mismatches.push({
            order_number: effectiveOrderNumber,
            event_kind: "expired",
            action: dryRun ? "pending" : "fixed",
            detail: `Sesión ${session.id} expirada sin reflejo`,
          });
          if (!dryRun) {
            await supabase
              .from("orders")
              .update({ status: "cancelled", payment_status: "expired" })
              .eq("id", order.id);
            const oppId = await resolveOpportunityId(metaOppId, effectiveOrderNumber);
            if (oppId && !(await hasActivityForEvent(oppId, session.id))) {
              await logCrmActivity(
                oppId,
                `⌛ Sesión expirada (reconciliación) — Orden ${effectiveOrderNumber ?? session.id}`,
                { event_kind: "expired", order_number: effectiveOrderNumber, stripe_session_id: session.id },
              );
            }
            fixed++;
          }
        }
      }
    }
  } catch (e) {
    console.error("sessions scan failed", (e as Error).message);
  }

  // --- 2) Charges (refunds + failures) ----------------------------------------
  try {
    for await (const charge of stripe.charges.list({
      created: { gte: since, lte: until },
      limit: 100,
    })) {
      scanned++;
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null;
      const metaOrderNumber = (charge.metadata as Record<string, string> | null)?.order_number ?? null;
      const metaOppId = (charge.metadata as Record<string, string> | null)?.opportunity_id ?? null;

      let order: { id: string; order_number: string | null; payment_status: string | null } | null = null;
      if (paymentIntentId) {
        const { data } = await supabase.from("orders").select("id, order_number, payment_status").eq("stripe_payment_intent", paymentIntentId).maybeSingle();
        order = data ?? null;
      }
      if (!order && metaOrderNumber) {
        const { data } = await supabase.from("orders").select("id, order_number, payment_status").eq("order_number", metaOrderNumber).maybeSingle();
        order = data ?? null;
      }
      if (!order) continue;

      const effectiveOrderNumber = order.order_number ?? metaOrderNumber;
      const currency = (charge.currency || "mxn").toUpperCase();

      if (charge.refunded && order.payment_status !== "refunded") {
        const amountRefunded = typeof charge.amount_refunded === "number" ? charge.amount_refunded / 100 : null;
        mismatches.push({
          order_number: effectiveOrderNumber,
          event_kind: "refunded",
          action: dryRun ? "pending" : "fixed",
          detail: `Charge ${charge.id} reembolsado sin reflejo`,
        });
        if (!dryRun) {
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              payment_status: "refunded",
              notes: `Stripe: reembolso ${amountRefunded ?? "?"} ${currency}`,
            })
            .eq("id", order.id);
          const oppId = await resolveOpportunityId(metaOppId, effectiveOrderNumber);
          if (oppId) {
            await supabase
              .from("crm_opportunities")
              .update({
                stage: "perdido",
                lost_reason: `Reembolso Stripe${amountRefunded != null ? ` $${amountRefunded.toFixed(2)} ${currency}` : ""}`,
                closed_at: new Date().toISOString(),
              })
              .eq("id", oppId);
            if (!(await hasActivityForEvent(oppId, charge.id))) {
              await logCrmActivity(
                oppId,
                `↩️ Reembolso (reconciliación) — Orden ${effectiveOrderNumber ?? charge.id}`,
                {
                  event_kind: "refunded",
                  order_number: effectiveOrderNumber,
                  amount: amountRefunded,
                  currency,
                  payment_intent: paymentIntentId,
                  charge_id: charge.id,
                },
              );
            }
          }
          fixed++;
        }
      } else if (charge.status === "failed" && order.payment_status !== "failed" && order.payment_status !== "paid") {
        mismatches.push({
          order_number: effectiveOrderNumber,
          event_kind: "failed",
          action: dryRun ? "pending" : "fixed",
          detail: charge.failure_message ?? "Charge fallido sin reflejo",
        });
        if (!dryRun) {
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              payment_status: "failed",
              stripe_payment_intent: paymentIntentId,
              notes: `Stripe: ${charge.failure_message ?? "pago rechazado"}`,
            })
            .eq("id", order.id);
          const oppId = await resolveOpportunityId(metaOppId, effectiveOrderNumber);
          if (oppId && !(await hasActivityForEvent(oppId, charge.id))) {
            await logCrmActivity(
              oppId,
              `❌ Pago rechazado (reconciliación) — Orden ${effectiveOrderNumber ?? charge.id}`,
              {
                event_kind: "failed",
                order_number: effectiveOrderNumber,
                payment_intent: paymentIntentId,
                charge_id: charge.id,
                reason: charge.failure_message,
              },
            );
          }
          fixed++;
        }
      }
    }
  } catch (e) {
    console.error("charges scan failed", (e as Error).message);
  }

  return new Response(
    JSON.stringify({ scanned, fixed, dry_run: dryRun, mismatches }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
