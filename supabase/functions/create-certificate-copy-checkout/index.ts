import Stripe from "https://esm.sh/stripe@14.21.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COPY_PRICE_MXN = 250; // Tarifa fija por copia certificada

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autenticado");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) throw new Error("Usuario no válido");

    const body = await req.json();
    const { certificateId } = body;
    if (!certificateId) throw new Error("certificateId requerido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: cert, error: certErr } = await supabase
      .from("certificates")
      .select("id, folio, service_type")
      .eq("id", certificateId)
      .single();
    if (certErr || !cert) throw new Error("Certificado no encontrado");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      locale: "es",
      line_items: [{
        price_data: {
          currency: "mxn",
          product_data: {
            name: `Copia certificada — ${cert.folio}`,
            description: `Reemisión de certificado (${cert.service_type})`,
          },
          unit_amount: COPY_PRICE_MXN * 100,
        },
        quantity: 1,
      }],
      success_url: `${req.headers.get("origin")}/portal/certificados?copy=success&cert=${cert.id}`,
      cancel_url: `${req.headers.get("origin")}/portal/certificados?copy=cancel`,
      metadata: {
        kind: "certificate_copy",
        certificate_id: cert.id,
        user_id: userData.user.id,
      },
    });

    // Track pending request
    await supabase.from("certificate_copy_requests").insert({
      certificate_id: cert.id,
      requested_by: userData.user.id,
      stripe_session_id: session.id,
      amount_mxn: COPY_PRICE_MXN,
      payment_status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("create-certificate-copy-checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
