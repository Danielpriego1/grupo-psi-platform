import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
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
      // For testing without webhook secret
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          await supabase
            .from("orders")
            .update({
              status: "confirmed",
              payment_status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent as string,
            })
            .eq("id", orderId);
        } else if (orderNumber) {
          await supabase
            .from("orders")
            .update({
              status: "confirmed",
              payment_status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent as string,
            })
            .eq("order_number", orderNumber);
        }

        console.log(`Pago confirmado: ${orderNumber} | Session: ${session.id}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const orderNumber = session.metadata?.order_number;

        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "cancelled", payment_status: "expired" })
            .eq("id", orderId);
        } else if (orderNumber) {
          await supabase
            .from("orders")
            .update({ status: "cancelled", payment_status: "expired" })
            .eq("order_number", orderNumber);
        }

        console.log(`Sesion expirada: ${orderNumber}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Pago fallido: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Error procesando evento:", err.message);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
