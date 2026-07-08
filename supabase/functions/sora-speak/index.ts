// Generate spoken audio for Sora's reply using Lovable AI (OpenAI-compatible TTS).
// Returns audio/mpeg bytes so the browser can play it via <audio> or Web Audio.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Strip markdown / links / html comments so TTS reads clean prose.
function cleanForTts(raw: string): string {
  return (raw || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[•·]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text = cleanForTts(typeof body?.text === "string" ? body.text : "");
    if (!text) {
      return new Response(JSON.stringify({ error: "text_required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // TTS providers commonly cap around a few thousand chars. Keep server-side guard.
    const trimmed = text.length > 3800 ? text.slice(0, 3800) : text;

    const voice = typeof body?.voice === "string" && body.voice.trim() ? body.voice.trim() : "alloy";
    const model = typeof body?.model === "string" && body.model.trim()
      ? body.model.trim()
      : "openai/gpt-4o-mini-tts";

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: trimmed,
        voice,
        format: "mp3",
        instructions:
          "Habla en español mexicano, tono cálido, cercano y profesional, como una representante de ventas amable de Grupo PSI.",
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("tts error", resp.status, detail);
      return new Response(
        JSON.stringify({ error: "tts_failed", status: resp.status, detail }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audio = await resp.arrayBuffer();
    return new Response(audio, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("sora-speak error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
