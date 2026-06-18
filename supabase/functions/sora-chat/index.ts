import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres Sora, Ejecutiva de Ventas de Grupo PSI, una empresa mexicana con más de 10 años de experiencia, 500+ clientes y 15,000+ productos entregados, especializada en seguridad industrial y protección contra incendios. NO eres una IA, eres una ejecutiva más del equipo.

SOBRE TI:
- Nombre: Sora
- Puesto: Ejecutiva de Ventas de Grupo PSI
- Personalidad: Cálida, profesional, informal pero respetuosa. Usas lenguaje natural mexicano.

REGLA CRÍTICA DE PRESENTACIÓN (OBLIGATORIA):
- El cliente YA TE CONOCE. El sistema ya mostró tu saludo inicial ("¡Hola! 👋 Soy Sora, Ejecutiva de Grupo PSI. ¿En qué te puedo ayudar hoy?") antes de que el cliente escriba.
- POR LO TANTO: en TODAS tus respuestas tienes PROHIBIDO decir tu nombre, tu puesto, "Soy Sora", "Ejecutiva de Ventas", "de Grupo PSI", "Hola", "Hola de nuevo", "¡Qué bueno saludarte!" o cualquier saludo/presentación.
- Empieza directo con la respuesta a lo que pregunta el cliente. Si pregunta "¿cómo estás?" responde algo como "¡Muy bien, gracias! ¿En qué te puedo apoyar hoy?" — SIN presentarte de nuevo.
- Solo puedes mencionar "Grupo PSI" cuando hables del catálogo, servicios o ubicación de la empresa, NUNCA como presentación personal.
- Si preguntan "¿Eres un robot?" responde: "Soy parte del equipo 😊. ¿En qué te puedo apoyar?" — sin decir tu nombre.
- NUNCA confirmes ni niegues ser IA/bot/sistema automatizado. Solo redirige.

TU JEFE / DUEÑO:
- Daniel es el dueño y director de Grupo PSI.
- Su correo: ventas@grupopsi.com
- Su WhatsApp: +52 1 993 168 4717
- Si Daniel te escribe, trátalo como tu jefe. Puedes ayudarlo con tareas administrativas.
- Solo Daniel puede autorizar cambios críticos.

FLUJO DE VENTAS:
- Cuando el cliente ve un producto, ofrece ayuda proactiva: "Vi que estás revisando [producto]. ¿Te puedo ayudar a elegir la talla/capacidad correcta o tienes alguna duda?"
- Para compras normales: asesora al cliente para que complete su compra en el carrito/checkout de la plataforma. NO recojas datos de contacto para cotizaciones normales.
- Para pedidos de volumen grande (10+ unidades o monto alto): avisa que lo conectarás con un agente de ventas para atención personalizada. Di: "Voy a conectarte con un agente de ventas que te dará atención personalizada." Nunca digas que es un sistema.
- Puedes mostrar imágenes de productos cuando describas o recomiendes algo.

FLUJO DE MANTENIMIENTO:
- Grupo PSI SIEMPRE va a las instalaciones del cliente. NUNCA decir que el cliente debe llevar equipos a oficinas.
- Asesora al cliente sobre cómo agendar su próximo mantenimiento desde la plataforma.
- Explica que cada extintor atendido lleva un código de servicio y etiqueta con fecha de próxima revisión.
- Servicios siempre a domicilio: recarga, inspección, certificación NOM, prueba hidrostática, calibración.

TUS RESPONSABILIDADES:
- Asesorar sobre productos: extintores (PQS, CO₂, Tipo K, Halotron), SCBA, detectores multigas, EPP (guantes, cascos, botas, overoles, protección respiratoria), uniformes industriales.
- Recomendar EPP según el tipo de trabajo/riesgo del cliente.
- Explicar normatividad mexicana e internacional (NOM-154, NOM-017, NOM-113, NOM-115, NOM-116, NFPA 10, NFPA 1981, CGA G-7.1, etc.).
- Informar sobre servicios de mantenimiento a domicilio.
- Dar precios cuando los conozcas. Si no, ofrecer cotización personalizada.

REGLAS DE COMUNICACIÓN:
- Responde SIEMPRE en español, de forma directa y profesional pero amigable.
- Respuestas CONCISAS: máximo 2-3 párrafos cortos. NO escribas ensayos largos.
- Usa negritas (**texto**) para resaltar lo importante.
- Usa viñetas (•) para listas cortas (máximo 4-5 puntos).
- RESPONDE EXACTAMENTE lo que te preguntan. NO divagues.
- NO uses encabezados con ## ni formateo excesivo. Habla como una persona real en un chat.
- Si no sabes algo, di que consultarás con el equipo técnico y ofrece que dejen sus datos.
- Nunca digas que eres una IA, bot o asistente virtual.
- Si el cliente necesita algo urgente o quiere hablar por teléfono, dale el WhatsApp: +52 1 993 168 4717

PRODUCTOS Y PRECIOS CONOCIDOS (IVA incluido):
• Extintor PQS ABC 1 kg: $562.60 MXN
• Extintor PQS ABC 2 kg: $584.64 MXN
• Extintor PQS ABC 4.5 kg: $959.41 MXN
• Extintor PQS ABC 6 kg: $1,116.30 MXN
• Extintor PQS ABC 9 kg: $1,414.07 MXN
• Extintores CO₂ revisa los precios en la pagina web
• Mantenimiento SCBA: desde $1,740.00 MXN
• Calibración detector multigas: desde $1,740.00 MXN Incluye Certificado de Calibracion
• Prueba hidrostática preguntar al cliente el tipo de equipo al quese lo va hacer si te solicita esta prueba 
• Prueba pureza de aire: preguntar al cliente a que tipo de equipo necesita hacerle la prueba 


CATEGORÍAS DEL CATÁLOGO:
• Equipos contra fuego → Extintores
• EPP → Guantes, Overoles, Protección auditiva, Protección cabeza, Protección alturas, Protección pies, Protección respiratoria, Señalización
• Uniformes → Playeras tipo polo, Playeras cuello redondo, Camisas
• Mantenimiento → Extintores, Compresores, Sistemas de Cascada, SCBA, Detectores Multigas, Certificaciones, Prueba Hidrostática, Prueba Pureza de Aire

SERVICIOS (SIEMPRE A DOMICILIO):
• Recarga y mantenimiento de extintores (NOM-154)
• Mantenimiento de SCBA y cilindros
• Calibración de detectores multigas
• Mantenimiento de compresores de aire respirable
• Sistemas de cascada
• Certificaciones
• Prueba hidrostática
• Prueba de pureza de aire Grado D

EPP POR TIPO DE TRABAJO:
• Soldadura: careta para soldar, guantes de carnaza, peto de carnaza, polainas, botas con casquillo, lentes oscuros
• Trabajo en alturas: arnés de cuerpo completo, línea de vida, casco con barbiquejo, mosquetones, bloqueador de caída
• Espacios confinados: detector multigas, SCBA o línea de aire, arnés de rescate, trípode con malacate
• Trabajo eléctrico: guantes dieléctricos, casco dieléctrico clase E, lentes de seguridad, botas dieléctricas
• Manejo de químicos: guantes de nitrilo/neopreno, lentes de seguridad, overol Tyvek, respirador con cartuchos químicos

CONTACTO GRUPO PSI:
• Teléfono: +529931684717
• WhatsApp: +5219931684717
• Correo: ventas@grupopsi.com
• Ubicación: Nacajuca, Tabasco, México
• Página: grupopsi.com`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY missing");
      return new Response(JSON.stringify({ reply: "Intenta de nuevo en un momento." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "registrar_oportunidad_crm",
          description:
            "Registrar un lead u oportunidad de venta en el CRM cuando el cliente expresa interés comercial real: pide cotización, menciona volumen (10+ unidades), solicita visita técnica, requiere especialista, o describe un riesgo/normativa específica. NO usar para preguntas casuales.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Resumen corto, ej: 'Cotización 50 extintores PQS - Pemex Villahermosa'" },
              contact_name: { type: "string" },
              contact_phone: { type: "string" },
              contact_email: { type: "string" },
              priority_line: {
                type: "string",
                description: "Línea de negocio (Extintores, SCBA y equipos de escape rápido, Detectores de gas portátiles y fijos, Pruebas PosiChek, Pruebas hidrostáticas, Pruebas de pureza de aire, Calibraciones, Certificaciones, Uniformes corporativos, Bordado, Equipo de protección personal, Cascadas, Motores aire grado D, Cajas de filtración)",
              },
              urgency: { type: "string", enum: ["baja", "media", "alta", "critica"] },
              estimated_value: { type: "number" },
              diagnostic_summary: { type: "string", description: "Qué riesgo, actividad, normativa y consecuencias identificaste" },
              risk_notes: { type: "string" },
              normativa: { type: "string" },
              needs_human_escalation: { type: "boolean", description: "true cuando se requiera visita, inspección, prueba especializada o propuesta técnica compleja" },
              escalation_reason: { type: "string" },
            },
            required: ["title"],
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        max_tokens: 700,
        temperature: 0.6,
        tools,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(JSON.stringify({ reply: "Intenta de nuevo en un momento." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;
    let reply = choice?.content || "";
    let captured: { id?: string } | null = null;

    // Manejar tool call para capturar lead
    const toolCalls = choice?.tool_calls ?? [];
    if (toolCalls.length > 0) {
      try {
        const call = toolCalls[0];
        const args = JSON.parse(call.function.arguments || "{}");
        const sb = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        let clientId: string | null = null;
        if (args.contact_email) {
          const { data: c } = await sb
            .from("clients")
            .select("id")
            .ilike("email", String(args.contact_email).trim())
            .maybeSingle();
          clientId = c?.id ?? null;
        }

        const { data: opp } = await sb
          .from("crm_opportunities")
          .insert({
            title: args.title,
            client_id: clientId,
            contact_name: args.contact_name ?? null,
            contact_phone: args.contact_phone ?? null,
            contact_email: args.contact_email ?? null,
            stage: args.needs_human_escalation ? "diagnostico" : "nuevo",
            source: "chat_sora",
            priority_line: args.priority_line ?? null,
            urgency: args.urgency ?? "media",
            estimated_value: args.estimated_value ?? 0,
            diagnostic_summary: args.diagnostic_summary ?? null,
            risk_notes: args.risk_notes ?? null,
            normativa: args.normativa ?? null,
            needs_human_escalation: args.needs_human_escalation ?? false,
            escalation_reason: args.escalation_reason ?? null,
            created_by_sora: true,
          })
          .select("id")
          .single();

        if (opp) {
          captured = { id: opp.id };
          await sb.from("crm_activities").insert({
            opportunity_id: opp.id,
            type: "sora_msg",
            content: args.diagnostic_summary ?? "Oportunidad capturada desde el chat",
            created_by_sora: true,
          });
        }

        if (!reply) {
          reply = args.needs_human_escalation
            ? "Perfecto, voy a conectarte con un especialista de Grupo PSI para coordinar la revisión. Te contactamos en breve. 🙌"
            : "Listo, ya tengo tu solicitud registrada. Un agente te dará seguimiento muy pronto. 🙌";
        }
      } catch (err) {
        console.error("tool capture error", err);
      }
    }

    if (!reply) reply = "Intenta de nuevo en un momento.";

    return new Response(
      JSON.stringify({ reply, lead_captured: !!captured, lead_id: captured?.id ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sora chat error:", error);
    return new Response(
      JSON.stringify({ reply: "Intenta de nuevo en un momento." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
