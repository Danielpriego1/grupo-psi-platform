import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const body = await req.json();
    const { items, clientName, clientPhone, successUrl, cancelUrl } = body;

    if (!items || items.length === 0) {
      throw new Error("No hay productos en el carrito");
    }

    // Build line items for Stripe
    const lineItems = items.map((item: any) => {
      const price = item.product.discount
        ? Math.round(item.product.priceOriginalMxn * (1 - item.product.discount) * 100)
        : Math.round(item.product.priceOriginalMxn * 100);

      return {
        price_data: {
          currency: "mxn",
          product_data: {
            name: item.product.name,
            description: item.product.description?.substring(0, 200) || "",
            images: item.product.image ? [item.product.image] : [],
          },
          unit_amount: price,
        },
        quantity: item.quantity,
      };
    });

    // Save order to Supabase before checkout
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const orderNumber = `GRP-${Date.now().toString(36).toUpperCase()}`;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        total: items.reduce((sum: number, i: any) => {
          const p = i.product.discount
            ? i.product.priceOriginalMxn * (1 - i.product.discount)
            : i.product.priceOriginalMxn;
          return sum + p * i.quantity;
        }, 0),
        notes: `Cliente: ${clientName || "No especificado"} | Tel: ${clientPhone || "No especificado"}`,
        payment_method: "stripe",
      })
      .select()
      .single();

    if (orderError) console.error("Error guardando orden:", orderError);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/`,
      metadata: {
        order_number: orderNumber,
        client_name: clientName || "",
        client_phone: clientPhone || "",
        order_id: orderData?.id || "",
      },
      customer_email: undefined,
      locale: "es",
      payment_intent_data: {
        description: `Pedido ${orderNumber} - Grupo PSI`,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderNumber }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error en create-checkout-session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
