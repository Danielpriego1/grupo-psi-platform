import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "valid" | "invalid" | "already" | "done" | "error">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON },
        });
        const data = await r.json();
        if (!r.ok) { setState("invalid"); return; }
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch { setState("error"); }
    })();
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    if (error) setState("error");
    else if (data?.success) setState("done");
    else if (data?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Cancelar notificaciones</h1>
        {state === "loading" && <p className="text-muted-foreground">Validando…</p>}
        {state === "valid" && (
          <>
            <p className="text-muted-foreground">¿Confirmas que ya no quieres recibir correos de Grupo Psi?</p>
            <Button onClick={confirm} disabled={busy}>{busy ? "Procesando…" : "Cancelar suscripción"}</Button>
          </>
        )}
        {state === "done" && <p className="text-green-500">Listo. No recibirás más correos.</p>}
        {state === "already" && <p className="text-muted-foreground">Esta dirección ya estaba dada de baja.</p>}
        {state === "invalid" && <p className="text-destructive">Enlace inválido o expirado.</p>}
        {state === "error" && <p className="text-destructive">Algo falló. Intenta de nuevo más tarde.</p>}
      </div>
    </main>
  );
}
