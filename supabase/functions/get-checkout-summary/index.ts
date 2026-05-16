import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseNotes(notes: string | null) {
  if (!notes) return { clientName: "", clientPhone: "", paymentMethod: "" };
  const name = notes.match(/Cliente:\s*([^|]+?)(?:\s*\||$)/i)?.[1]?.trim() || "";
  const phone = notes.match(/Tel:\s*([^|]+?)(?:\s*\||$)/i)?.[1]?.trim() || "";
  const pay = notes.match(/Pago:\s*([^|]+?)(?:\s*\||$)/i)?.[1]?.trim() || "";
  return { clientName: name, clientPhone: phone, paymentMethod: pay };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const orderNumber = url.searchParams.get("order_number");

    if (!sessionId && !orderNumber) {
      return new Response(JSON.stringify({ error: "session_id u order_number requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1) Fetch Stripe session if available
    let stripeStatus: string | null = null;
    let stripeAmountTotal: number | null = null;
    let stripeCurrency: string | null = null;
    let stripeCustomerEmail: string | null = null;
    let resolvedOrderNumber = orderNumber;

    if (sessionId) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          stripeStatus = session.payment_status;
          stripeAmountTotal = session.amount_total;
          stripeCurrency = session.currency;
          stripeCustomerEmail = session.customer_details?.email ?? session.customer_email ?? null;
          if (!resolvedOrderNumber) {
            resolvedOrderNumber = (session.metadata?.order_number as string) ?? null;
          }
        } catch (e) {
          console.warn("No se pudo recuperar la sesión de Stripe:", (e as Error).message);
        }
      }
    }

    // 2) Find the order
    let orderQuery = supabase.from("orders").select("*").limit(1);
    if (sessionId) {
      orderQuery = supabase.from("orders").select("*").eq("stripe_session_id", sessionId).limit(1);
    } else if (resolvedOrderNumber) {
      orderQuery = supabase.from("orders").select("*").eq("order_number", resolvedOrderNumber).limit(1);
    }
    let { data: order } = await orderQuery.maybeSingle();

    // Fallback: webhook may not have linked session_id yet
    if (!order && resolvedOrderNumber) {
      const { data: byNumber } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", resolvedOrderNumber)
        .maybeSingle();
      order = byNumber;
    }

    if (!order) {
      return new Response(
        JSON.stringify({
          error: "Pedido no encontrado todavía",
          stripe: { status: stripeStatus, amount_total: stripeAmountTotal, currency: stripeCurrency },
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Items
    const { data: items = [] } = await supabase
      .from("order_items")
      .select("product_name, product_id, quantity, unit_price, subtotal")
      .eq("order_id", order.id);

    const { clientName, clientPhone, paymentMethod } = parseNotes(order.notes);

    return new Response(
      JSON.stringify({
        order: {
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          total: Number(order.total),
          paid_at: order.paid_at,
          created_at: order.created_at,
          ticket_token: order.ticket_token,
          stripe_session_id: order.stripe_session_id,
        },
        client: {
          name: clientName,
          phone: clientPhone,
          email: stripeCustomerEmail,
        },
        payment: {
          method: paymentMethod || "Stripe",
          stripe_status: stripeStatus,
          amount_total: stripeAmountTotal ? stripeAmountTotal / 100 : null,
          currency: stripeCurrency,
        },
        items,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error get-checkout-summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
