// Edge function que Sora (o el chat widget) invoca para capturar un lead/oportunidad en el CRM.
// Usa service role para insertar bypassando RLS, marcando el lead como creado por Sora.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CapturePayload {
  title: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  priority_line?: string;
  urgency?: "baja" | "media" | "alta" | "critica";
  estimated_value?: number;
  diagnostic_summary?: string;
  risk_notes?: string;
  normativa?: string;
  needs_human_escalation?: boolean;
  escalation_reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as CapturePayload;
    if (!body.title || body.title.trim().length < 3) {
      return new Response(JSON.stringify({ error: "title requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // intentar enlazar cliente por email
    let clientId: string | null = null;
    if (body.contact_email) {
      const { data: c } = await supabase
        .from("clients")
        .select("id")
        .ilike("email", body.contact_email.trim())
        .maybeSingle();
      clientId = c?.id ?? null;
    }

    const { data, error } = await supabase
      .from("crm_opportunities")
      .insert({
        title: body.title.trim(),
        client_id: clientId,
        contact_name: body.contact_name ?? null,
        contact_phone: body.contact_phone ?? null,
        contact_email: body.contact_email ?? null,
        stage: body.needs_human_escalation ? "diagnostico" : "nuevo",
        source: "chat_sora",
        priority_line: body.priority_line ?? null,
        urgency: body.urgency ?? "media",
        estimated_value: body.estimated_value ?? 0,
        diagnostic_summary: body.diagnostic_summary ?? null,
        risk_notes: body.risk_notes ?? null,
        normativa: body.normativa ?? null,
        needs_human_escalation: body.needs_human_escalation ?? false,
        escalation_reason: body.escalation_reason ?? null,
        created_by_sora: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("crm capture insert", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // bitácora inicial
    await supabase.from("crm_activities").insert({
      opportunity_id: data.id,
      type: "sora_msg",
      content:
        body.diagnostic_summary ??
        "Oportunidad capturada por Sora desde el chat.",
      created_by_sora: true,
    });

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sora-crm-capture", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
