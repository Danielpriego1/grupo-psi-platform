import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

/**
 * Recibe el formulario público de contacto: valida, guarda el mensaje y avisa
 * por correo y push a los administradores. Pública (verify_jwt = false).
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FALLBACK_RECIPIENT = "ventas@grupopsi.com";

const BodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(4000),
  correlationId: z.string().trim().max(64).optional().or(z.literal("")),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const { name, email, phone, company, subject, message, correlationId } = parsed.data;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Anti-spam simple: máximo 3 mensajes por correo en 10 minutos.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return json({ error: "too_many_requests" }, 429);
  }

  const finalSubject = subject || "Mensaje desde el sitio web";

  const { data: inserted, error } = await admin
    .from("contact_messages")
    .insert({
      name,
      email,
      phone: phone || null,
      company: company || null,
      subject: finalSubject,
      message,
      correlation_id: correlationId || null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("no se pudo guardar el mensaje de contacto", error);
    return json({ error: "storage_failed" }, 500);
  }

  const receivedAt = new Date(inserted.created_at as string).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    dateStyle: "long",
    timeStyle: "short",
  });

  // Destinatarios: administradores registrados; si no hay, ventas@.
  let recipients: string[] = [];
  try {
    const { data } = await admin.rpc("get_admin_recipient_emails");
    recipients = ((data ?? []) as { email: string }[]).map((r) => r.email).filter(Boolean);
  } catch (err) {
    console.error("no se pudieron leer los correos de admin", err);
  }
  if (!recipients.includes(FALLBACK_RECIPIENT)) recipients.push(FALLBACK_RECIPIENT);

  await Promise.allSettled(
    recipients.map((to) =>
      fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({
          templateName: "nuevo-mensaje-contacto",
          recipientEmail: to,
          templateData: {
            name,
            email,
            phone: phone || "—",
            company: company || "—",
            subject: finalSubject,
            message,
            receivedAt,
          },
        }),
      }),
    ),
  );

  try {
    await fetch(`${SUPABASE_URL}/functions/v1/push-send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        title: `Nuevo mensaje · ${name}`,
        body: finalSubject,
        url: "/admin/crm",
        tag: "contacto",
        kind: "other",
      }),
    });
  } catch (err) {
    console.error("push de contacto falló", err);
  }

  return json({ ok: true, id: inserted.id });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
