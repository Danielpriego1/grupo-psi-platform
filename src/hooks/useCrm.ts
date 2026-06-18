import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CrmStage =
  | "nuevo"
  | "diagnostico"
  | "cotizado"
  | "negociacion"
  | "ganado"
  | "perdido";

export type CrmUrgency = "baja" | "media" | "alta" | "critica";
export type CrmSource =
  | "chat_sora"
  | "cotizacion"
  | "mantenimiento"
  | "manual"
  | "web";

export interface CrmOpportunity {
  id: string;
  title: string;
  client_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  stage: CrmStage;
  source: CrmSource;
  source_ref: string | null;
  priority_line: string | null;
  estimated_value: number;
  urgency: CrmUrgency;
  risk_notes: string | null;
  normativa: string | null;
  diagnostic_summary: string | null;
  assigned_to: string | null;
  created_by_sora: boolean;
  needs_human_escalation: boolean;
  escalation_reason: string | null;
  won_amount: number | null;
  lost_reason: string | null;
  closed_at: string | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmTask {
  id: string;
  opportunity_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  status: "pendiente" | "completada" | "vencida" | "cancelada";
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
}

export type CrmActivityType =
  | "nota"
  | "llamada"
  | "email"
  | "whatsapp"
  | "visita"
  | "sora_msg"
  | "escalamiento"
  | "cambio_etapa"
  | "tarea"
  | "pago";

export type PaymentEventKind = "paid" | "failed" | "expired" | "refunded";

export interface CrmActivity {
  id: string;
  opportunity_id: string;
  type: CrmActivityType;
  content: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_by_sora: boolean;
  created_at: string;
}

export function useOpportunities() {
  return useQuery({
    queryKey: ["crm-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CrmOpportunity[];
    },
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["crm-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_tasks")
        .select("*")
        .order("due_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as CrmTask[];
    },
  });
}

export function useActivities(opportunityId: string | null) {
  return useQuery({
    queryKey: ["crm-activities", opportunityId],
    enabled: !!opportunityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("opportunity_id", opportunityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CrmActivity[];
    },
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<CrmOpportunity>;
    }) => {
      const { error } = await supabase
        .from("crm_opportunities")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-opportunities"] });
    },
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<CrmOpportunity> & { title: string },
    ) => {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .insert(input as never)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-opportunities"] }),
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      opportunity_id: string;
      type: CrmActivity["type"];
      content: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("crm_activities").insert({
        ...input,
        created_by: u.user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_v, vars) => {
      qc.invalidateQueries({ queryKey: ["crm-activities", vars.opportunity_id] });
      qc.invalidateQueries({ queryKey: ["crm-opportunities"] });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CrmTask> & { title: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("crm_tasks").insert({
        ...input,
        created_by: u.user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CrmTask> }) => {
      const { error } = await supabase
        .from("crm_tasks")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });
}

export const STAGE_META: Record<CrmStage, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  diagnostico: { label: "Diagnóstico", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  cotizado: { label: "Cotizado", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  negociacion: { label: "Negociación", color: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  ganado: { label: "Ganado", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  perdido: { label: "Perdido", color: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export const URGENCY_META: Record<CrmUrgency, { label: string; color: string }> = {
  baja: { label: "Baja", color: "text-slate-300" },
  media: { label: "Media", color: "text-amber-300" },
  alta: { label: "Alta", color: "text-orange-400" },
  critica: { label: "Crítica", color: "text-red-400" },
};

export const PIPELINE_ORDER: CrmStage[] = [
  "nuevo",
  "diagnostico",
  "cotizado",
  "negociacion",
  "ganado",
  "perdido",
];
