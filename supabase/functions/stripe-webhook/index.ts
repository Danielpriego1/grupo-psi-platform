import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? Deno.env.get("stripe_webhook_secret");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeKey) {
    return new Response("STRIPE_SECRET_KEY no configurada", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("Error verificando webhook:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Idempotency: skip if already processed successfully
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id, processing_status")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing?.processing_status === "success") {
    console.log(`Evento ${event.id} ya procesado, omitiendo`);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Log received event
  const { data: auditRow } = await supabase
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      processing_status: "received",
      raw_payload: event as any,
      received_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const auditId = auditRow?.id;

  const updateAudit = async (patch: Record<string, unknown>) => {
    if (!auditId) {
      console.error("updateAudit: auditId nulo, no se puede actualizar registro");
      return;
    }
    const { error } = await supabase
      .from("stripe_webhook_events")
      .update({ ...patch, processed_at: new Date().toISOString() })
      .eq("id", auditId);
    if (error) console.error("updateAudit error:", error.message);
  };

  // ---- CRM helpers ----------------------------------------------------------
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

  const logCrmActivity = async (
    opportunityId: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ) => {
    const { error } = await supabase.from("crm_activities").insert({
      opportunity_id: opportunityId,
      type: "sora_msg",
      content,
      created_by_sora: true,
      metadata,
    });
    if (error) console.error("crm activity insert error:", error.message);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const nullIfEmpty = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : null);
        const orderNumber = nullIfEmpty(session.metadata?.order_number);
        const orderId = nullIfEmpty(session.metadata?.order_id);
        const metaOppId = nullIfEmpty(session.metadata?.opportunity_id);
        const paymentIntentId = nullIfEmpty(session.payment_intent as string);
        const ticketToken = crypto.randomUUID();
        const amountTotal = session.amount_total ? session.amount_total / 100 : null;

        const updates = {
          status: "confirmed" as const,
          payment_status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent: paymentIntentId,
          paid_at: new Date().toISOString(),
          ticket_token: ticketToken,
        };

        // Cascade match: order_id → order_number → stripe_session_id → payment_intent
        const tryUpdate = async (col: string, val: string | null) => {
          if (!val) return { matched: 0, error: null as string | null };
          const { data, error } = await supabase
            .from("orders")
            .update(updates)
            .eq(col, val)
            .select("id");
          return { matched: data?.length ?? 0, error: error?.message ?? null };
        };

        let matched = 0;
        let updateError: string | null = null;
        for (const [col, val] of [
          ["id", orderId],
          ["order_number", orderNumber],
          ["stripe_session_id", session.id],
          ["stripe_payment_intent", paymentIntentId],
        ] as [string, string | null][]) {
          const r = await tryUpdate(col, val);
          if (r.error) { updateError = r.error; break; }
          if (r.matched > 0) { matched = r.matched; break; }
        }

        const orphan = !updateError && matched === 0;
        await updateAudit({
          processing_status: updateError ? "error" : orphan ? "orphan" : "success",
          payment_status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent: paymentIntentId,
          order_id: orderId,
          order_number: orderNumber,
          ticket_generated: matched > 0,
          ticket_token: matched > 0 ? ticketToken : null,
          error_message: updateError ?? (orphan ? `No se encontró orden (order_id=${orderId}, order_number=${orderNumber}, session=${session.id})` : null),
        });

        if (orphan) {
          console.warn(`ORPHAN checkout.session.completed: order_number=${orderNumber} session=${session.id}`);
        } else {
          console.log(`Pago confirmado: ${orderNumber} | Session: ${session.id} | matched=${matched}`);

          // --- Actualizar CRM: marcar oportunidad como ganada -----------------
          try {
            const oppId = await resolveOpportunityId(metaOppId, orderNumber);
            if (oppId) {
              const { error: oppErr } = await supabase
                .from("crm_opportunities")
                .update({
                  stage: "ganado",
                  won_amount: amountTotal,
                  closed_at: new Date().toISOString(),
                  needs_human_escalation: false,
                })
                .eq("id", oppId);
              if (oppErr) console.error("crm opp update error:", oppErr.message);
              await logCrmActivity(
                oppId,
                `✅ Pago confirmado — Orden ${orderNumber ?? session.id}${
                  amountTotal != null ? ` — $${amountTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN` : ""
                }`,
                { order_number: orderNumber, stripe_session_id: session.id, payment_intent: paymentIntentId },
              );
              console.log(`CRM oportunidad ${oppId} marcada como ganada`);
            } else {
              console.log(`Sin oportunidad CRM ligada a ${orderNumber}`);
            }
          } catch (e) {
            console.warn("crm sync failed", (e as Error).message);
          }

          // Notificación admin (no bloquea)
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
            const amount = session.amount_total ? (session.amount_total / 100).toLocaleString("es-MX", { style: "currency", currency: (session.currency || "mxn").toUpperCase() }) : "—";
            await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${svcKey}`, apikey: svcKey },
              body: JSON.stringify({
                templateName: "nuevo-pedido-pagado",
                idempotencyKey: `paid-${session.id}`,
                templateData: {
                  orderNumber: orderNumber ?? session.id,
                  amount,
                  currency: (session.currency || "MXN").toUpperCase(),
                  customerName: session.customer_details?.name ?? "Cliente",
                  customerEmail: session.customer_details?.email ?? "—",
                  paidAt: new Date().toLocaleString("es-MX"),
                },
              }),
            });
          } catch (e) {
            console.warn("notify email failed", (e as Error).message);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id ?? null;
        const orderNumber = session.metadata?.order_number ?? null;

        let updateError: string | null = null;
        if (orderId) {
          const { error } = await supabase
            .from("orders")
            .update({ status: "cancelled", payment_status: "expired" })
            .eq("id", orderId);
          if (error) updateError = error.message;
        } else if (orderNumber) {
          const { error } = await supabase
            .from("orders")
            .update({ status: "cancelled", payment_status: "expired" })
            .eq("order_number", orderNumber);
          if (error) updateError = error.message;
        }

        await updateAudit({
          processing_status: updateError ? "error" : "success",
          payment_status: "expired",
          stripe_session_id: session.id,
          order_id: orderId,
          order_number: orderNumber,
          error_message: updateError,
        });

        console.log(`Sesion expirada: ${orderNumber}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const errMsg = paymentIntent.last_payment_error?.message ?? "Pago rechazado";
        const orderId = (paymentIntent.metadata as any)?.order_id ?? null;
        const orderNumber = (paymentIntent.metadata as any)?.order_number ?? null;

        let updateError: string | null = null;
        const patch = {
          status: "cancelled" as const,
          payment_status: "failed",
          stripe_payment_intent: paymentIntent.id,
          notes: `Stripe: ${errMsg}`,
        };

        if (orderId) {
          const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
          if (error) updateError = error.message;
        } else if (orderNumber) {
          const { error } = await supabase.from("orders").update(patch).eq("order_number", orderNumber);
          if (error) updateError = error.message;
        } else {
          const { error } = await supabase
            .from("orders")
            .update(patch)
            .eq("stripe_payment_intent", paymentIntent.id);
          if (error) updateError = error.message;
        }

        await updateAudit({
          processing_status: updateError ? "error" : "success",
          payment_status: "failed",
          stripe_payment_intent: paymentIntent.id,
          order_id: orderId,
          order_number: orderNumber,
          error_message: updateError ?? errMsg,
        });
        console.log(`Pago fallido: ${paymentIntent.id}`);
        break;
      }

      default:
        await updateAudit({ processing_status: "skipped" });
        console.log(`Evento no manejado: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Error procesando evento:", err.message);
    await updateAudit({
      processing_status: "error",
      error_message: err.message ?? String(err),
    });
    return new Response(`Error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
