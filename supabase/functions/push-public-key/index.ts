import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(
    JSON.stringify({ publicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? "" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
