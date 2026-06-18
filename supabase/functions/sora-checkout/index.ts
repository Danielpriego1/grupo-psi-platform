// Sora arma una venta ad-hoc en el chat: items con precio + cantidad, calcula total,
// crea una orden en la base, opcionalmente la liga a una oportunidad del CRM,
// y devuelve un link de Stripe Checkout para que el cliente pague.
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Item {
  name: string;
  description?: string;
  unit_amount_mxn: number; // precio unitario IVA incluido
  quantity: number;
}

interface Payload {
  items: Item[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  opportunity_id?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const body = (await req.json()) as Payload;
    const items = (body.items || []).filter(
      (i) => i && i.name && i.unit_amount_mxn > 0 && i.quantity > 0,
    );
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "Sin artículos válidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const total = items.reduce((s, i) => s + i.unit_amount_mxn * i.quantity, 0);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const orderNumber = `SOR-${Date.now().toString(36).toUpperCase()}`;
    const { data: order } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        total,
        contact_name: body.contact_name ?? null,
        contact_email: body.contact_email ?? null,
        contact_phone: body.contact_phone ?? null,
        notes: `Venta cerrada por Sora${body.notes ? " — " + body.notes : ""}`,
      })
      .select("id")
      .maybeSingle();

    const lineItems = items.map((it) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: it.name.slice(0, 250),
          ...(it.description ? { description: it.description.slice(0, 400) } : {}),
        },
        unit_amount: Math.round(it.unit_amount_mxn * 100),
      },
      quantity: it.quantity,
    }));

    const origin = req.headers.get("origin") || "https://checkout.grupopsi.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      locale: "es",
      customer_email: body.contact_email || undefined,
      success_url: `${origin}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${origin}/`,
      metadata: {
        order_number: orderNumber,
        source: "sora_chat",
        opportunity_id: body.opportunity_id || "",
        order_id: order?.id || "",
      },
      payment_intent_data: {
        description: `Pedido ${orderNumber} - Sora Grupo PSI`,
      },
    });

    // Ligar al CRM (actividad + posible cambio de etapa)
    if (body.opportunity_id) {
      await supabase.from("crm_activities").insert({
        opportunity_id: body.opportunity_id,
        type: "sora_msg",
        content: `💳 Link de pago generado por Sora — Orden ${orderNumber} — Total $${total.toLocaleString(
          "es-MX",
          { minimumFractionDigits: 2 },
        )} MXN`,
        created_by_sora: true,
        metadata: { order_number: orderNumber, checkout_url: session.url },
      });
      await supabase
        .from("crm_opportunities")
        .update({ stage: "cotizado", estimated_value: total, source_ref: orderNumber })
        .eq("id", body.opportunity_id);
    }

    return new Response(
      JSON.stringify({
        url: session.url,
        order_number: orderNumber,
        total,
        items,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    console.error("sora-checkout", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
