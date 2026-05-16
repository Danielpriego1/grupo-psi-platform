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
    if (!auditId) return;
    await supabase
      .from("stripe_webhook_events")
      .update({ ...patch, processed_at: new Date().toISOString() })
      .eq("id", auditId);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number ?? null;
        const orderId = session.metadata?.order_id ?? null;
        const ticketToken = crypto.randomUUID();

        const updates = {
          status: "confirmed" as const,
          payment_status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent: (session.payment_intent as string) ?? null,
          paid_at: new Date().toISOString(),
          ticket_token: ticketToken,
        };

        let updateError: string | null = null;
        if (orderId) {
          const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
          if (error) updateError = error.message;
        } else if (orderNumber) {
          const { error } = await supabase.from("orders").update(updates).eq("order_number", orderNumber);
          if (error) updateError = error.message;
        } else {
          updateError = "Sin order_id ni order_number en metadata";
        }

        await updateAudit({
          processing_status: updateError ? "error" : "success",
          payment_status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent: (session.payment_intent as string) ?? null,
          order_id: orderId,
          order_number: orderNumber,
          ticket_generated: !updateError,
          ticket_token: updateError ? null : ticketToken,
          error_message: updateError,
        });

        console.log(`Pago confirmado: ${orderNumber} | Session: ${session.id}`);
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
