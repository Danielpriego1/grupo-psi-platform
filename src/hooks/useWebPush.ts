import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SW_PATH = "/sw.js";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState = "unsupported" | "idle" | "subscribing" | "subscribed" | "error";

export function useWebPush() {
  const [state, setState] = useState<PushState>("idle");
  const [error, setError] = useState<string | null>(null);
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) {
      setState("unsupported");
      return;
    }
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
        const sub = await reg?.pushManager.getSubscription();
        if (sub) setState("subscribed");
      } catch { /* ignore */ }
    })();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setError(null);
    setState("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("idle");
        setError("Permiso denegado");
        return;
      }
      const reg =
        (await navigator.serviceWorker.getRegistration(SW_PATH)) ??
        (await navigator.serviceWorker.register(SW_PATH));
      await navigator.serviceWorker.ready;

      const { data: keyRes, error: keyErr } = await supabase.functions.invoke("push-public-key");
      if (keyErr || !keyRes?.publicKey) throw new Error("No se pudo obtener la llave pública");
      const applicationServerKey = urlBase64ToUint8Array(keyRes.publicKey);

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      }
      const { error: subErr } = await supabase.functions.invoke("push-subscribe", {
        body: { action: "subscribe", subscription: sub.toJSON() },
      });
      if (subErr) throw subErr;
      setState("subscribed");
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
      setState("error");
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.functions.invoke("push-subscribe", {
          body: { action: "unsubscribe", endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setState("idle");
    } catch (e: any) {
      setError(e?.message ?? "Error al desactivar");
    }
  }, [supported]);

  return { state, error, supported, subscribe, unsubscribe };
}
