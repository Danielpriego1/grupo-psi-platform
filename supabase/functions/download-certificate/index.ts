import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const certificateId = url.searchParams.get("certificate_id");
    const downloadToken = url.searchParams.get("token");
    if (!certificateId) throw new Error("certificate_id requerido");

    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: cert, error: certErr } = await service
      .from("certificates")
      .select("id, pdf_url, client_id")
      .eq("id", certificateId)
      .single();
    if (certErr || !cert) throw new Error("Certificado no encontrado");
    if (!cert.pdf_url) throw new Error("Certificado sin PDF cargado");

    // Authorization layers:
    let authorized = false;

    // 1. Download token (paid copy)
    if (downloadToken) {
      const { data: req2 } = await service
        .from("certificate_copy_requests")
        .select("id, expires_at, payment_status")
        .eq("certificate_id", certificateId)
        .eq("download_token", downloadToken)
        .maybeSingle();
      if (
        req2 &&
        req2.payment_status === "paid" &&
        req2.expires_at &&
        new Date(req2.expires_at) > new Date()
      ) {
        authorized = true;
      }
    }

    // 2. Admin or matching client email (first-issue free)
    if (!authorized) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseAuth = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: u } = await supabaseAuth.auth.getUser();
        if (u?.user) {
          const { data: isAdmin } = await service.rpc("has_role", {
            _user_id: u.user.id,
            _role: "admin",
          });
          if (isAdmin) authorized = true;
          if (!authorized && u.user.email) {
            const { data: client } = await service
              .from("clients")
              .select("id")
              .eq("id", cert.client_id)
              .eq("email", u.user.email)
              .maybeSingle();
            if (client) authorized = true;
          }
        }
      }
    }

    if (!authorized) throw new Error("No autorizado");

    const { data: signed, error: signErr } = await service.storage
      .from("certificates")
      .createSignedUrl(cert.pdf_url, 300);
    if (signErr || !signed) throw new Error(signErr?.message || "No se pudo firmar URL");

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("download-certificate error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
});
