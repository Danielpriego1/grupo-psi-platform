import { supabase } from "@/integrations/supabase/client";

export type ServiceType = "mantenimiento" | "calibracion" | "hidrostatica" | "pureza_aire" | "posichek";
export type CertStatus = "vigente" | "por_vencer" | "vencido" | "revocado";

export const SERVICE_LABEL: Record<ServiceType, string> = {
  mantenimiento: "Mantenimiento",
  calibracion: "Calibración",
  hidrostatica: "Prueba hidrostática",
  pureza_aire: "Pureza de aire",
  posichek: "PosiChek",
};

export const STATUS_LABEL: Record<CertStatus, string> = {
  vigente: "Vigente",
  por_vencer: "Por vencer",
  vencido: "Vencido",
  revocado: "Revocado",
};

export function statusBadgeClass(status: CertStatus) {
  switch (status) {
    case "vigente":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "por_vencer":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "vencido":
      return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
    case "revocado":
      return "bg-muted text-muted-foreground border-border";
  }
}

export async function requestDownload(certificateId: string, token?: string) {
  const params = new URLSearchParams({ certificate_id: certificateId });
  if (token) params.set("token", token);
  const { data: sess } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-certificate?${params}`;
  const res = await fetch(url, {
    headers: sess.session?.access_token
      ? { Authorization: `Bearer ${sess.session.access_token}` }
      : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "No autorizado");
  return json.url as string;
}

export async function startCopyCheckout(certificateId: string) {
  const { data, error } = await supabase.functions.invoke("create-certificate-copy-checkout", {
    body: { certificateId },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("No se recibió URL de pago");
  window.location.href = data.url;
}
