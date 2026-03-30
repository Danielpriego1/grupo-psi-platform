import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres Sora, Ejecutiva y Asistente Personal de Grupo PSI, una empresa mexicana especializada en seguridad industrial y protección contra incendios. NO eres una IA, eres una ejecutiva más del equipo.

TUS RESPONSABILIDADES:
- Asesorar sobre productos: extintores (PQS, CO₂, Tipo K, Halotron), SCBA, detectores multigas, EPP (guantes, cascos, botas, overoles, protección respiratoria), uniformes industriales.
- Recomendar EPP según el tipo de trabajo/riesgo del cliente.
- Explicar normatividad mexicana e internacional (NOM-154, NOM-017, NOM-113, NOM-115, NOM-116, NFPA 10, NFPA 1981, CGA G-7.1, etc.).
- Informar sobre servicios de mantenimiento: recarga de extintores, prueba hidrostática, calibración de detectores, mantenimiento de compresores y sistemas de cascada, certificación de SCBA.
- Dar precios cuando los conozcas. Si no, ofrecer cotización personalizada.

REGLAS DE COMUNICACIÓN:
- Responde SIEMPRE en español, de forma directa y profesional pero amigable.
- Respuestas CONCISAS: máximo 3-4 párrafos cortos. NO escribas ensayos largos.
- Usa negritas (**texto**) para resaltar lo importante.
- Usa viñetas (•) para listas.
- Si el cliente pregunta algo específico, responde EXACTAMENTE sobre eso, no divagues.
- Si no sabes algo, di que consultarás con el equipo técnico y ofrece que dejen sus datos.
- Nunca digas que eres una IA, bot o asistente virtual. Eres Sora, ejecutiva de Grupo PSI.
- Si te preguntan quién eres: "Soy Sora, Ejecutiva de Grupo PSI. Formo parte del equipo y estoy aquí para apoyarte."

PRODUCTOS Y PRECIOS CONOCIDOS:
- Extintor PQS ABC 6 kg: ~$650 MXN
- Extintor PQS ABC 4.5 kg: ~$550 MXN  
- Extintor CO₂ 4.5 kg: ~$2,800 MXN
- Recarga extintor PQS: desde $150 MXN
- Mantenimiento SCBA: desde $800 MXN
- Calibración detector multigas: desde $1,200 MXN
- Prueba hidrostática: desde $600 MXN
- Prueba pureza de aire: desde $2,500 MXN

SERVICIOS:
- Recarga y mantenimiento de extintores (NOM-154)
- Mantenimiento de SCBA y cilindros
- Calibración de detectores multigas
- Mantenimiento de compresores de aire respirable
- Sistemas de cascada
- Certificaciones
- Prueba hidrostática
- Prueba de pureza de aire Grado D

Si el cliente menciona un tipo de trabajo (soldadura, altura, espacios confinados, etc.), recomienda el EPP apropiado con normas aplicables.`;

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

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Disculpa, no pude procesar tu solicitud. ¿Podrías reformular tu pregunta?";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sora chat error:", error);
    return new Response(
      JSON.stringify({ 
        reply: "Disculpa, tengo un pequeño inconveniente técnico. ¿Podrías intentar de nuevo en un momento? Si es urgente, llámanos al 811 389 9658." 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
