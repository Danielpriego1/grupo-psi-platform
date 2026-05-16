import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return new Response("STRIPE_SECRET_KEY no configurada", { status: 500 });

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
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "certificate_copy") {
        const expires = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
          .from("certificate_copy_requests")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            download_token: crypto.randomUUID(),
            expires_at: expires,
          })
          .eq("stripe_session_id", session.id);
        if (error) console.error("Update copy req error:", error);
        console.log(`Copia pagada para session ${session.id}`);
      }
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
