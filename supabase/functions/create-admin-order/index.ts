import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const POSTAL_CODE_REGEX = /^\d{5}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("No autorizado", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user from JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonError("Sesión inválida", 401);
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Check role: admin or vendor
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "vendor");
    if (!allowed) {
      return jsonError("Permisos insuficientes", 403);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Cuerpo de la solicitud inválido", 400);
    }

    const {
      order_number,
      client_id,
      total,
      notes,
      street,
      exterior_number,
      neighborhood,
      postal_code,
      state,
      municipality,
      latitude,
      longitude,
    } = body as Record<string, unknown>;

    // Postal code validation (server-side, authoritative)
    const postalCodeStr = typeof postal_code === "string" ? postal_code.trim() : "";
    if (!POSTAL_CODE_REGEX.test(postalCodeStr)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Código postal inválido",
          message: "El código postal debe tener exactamente 5 dígitos numéricos.",
          field: "postal_code",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return jsonError("Latitud y longitud son requeridas", 400);
    }

    if (typeof order_number !== "string" || order_number.trim().length === 0) {
      return jsonError("Número de pedido inválido", 400);
    }

    const composedAddress = [
      [typeof street === "string" ? street : "", typeof exterior_number === "string" ? exterior_number : ""]
        .filter(Boolean)
        .join(" ")
        .trim(),
      typeof neighborhood === "string" ? neighborhood : "",
      `C.P. ${postalCodeStr}`,
    ]
      .filter(Boolean)
      .join(", ");

    const { data: inserted, error: insertErr } = await admin
      .from("orders")
      .insert({
        order_number,
        client_id: client_id || null,
        total: typeof total === "number" ? total : parseFloat(String(total)) || 0,
        notes: typeof notes === "string" ? notes : null,
        address: composedAddress || null,
        state: typeof state === "string" && state ? state : null,
        municipality: typeof municipality === "string" && municipality ? municipality : null,
        latitude,
        longitude,
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) {
      return jsonError(insertErr.message, 500);
    }

    return new Response(
      JSON.stringify({ success: true, order: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return jsonError(e?.message ?? "Error inesperado", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message, message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
