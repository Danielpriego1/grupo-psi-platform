import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CrmOpportunity,
  STAGE_META,
  URGENCY_META,
  useActivities,
  useAddActivity,
  useUpdateOpportunity,
  useCreateTask,
} from "@/hooks/useCrm";
import { AlertTriangle, Bot, Calendar, CheckCircle2, ClipboardList, Clock, Mail, MessageSquare, Phone, RotateCcw, Sparkles, UserCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  opp: CrmOpportunity | null;
  onClose: () => void;
}

export function OpportunityDetail({ opp, onClose }: Props) {
  const [note, setNote] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const activities = useActivities(opp?.id ?? null);
  const update = useUpdateOpportunity();
  const addActivity = useAddActivity();
  const createTask = useCreateTask();

  if (!opp) return null;

  const stageMeta = STAGE_META[opp.stage];
  const urg = URGENCY_META[opp.urgency];

  const setStage = (stage: CrmOpportunity["stage"]) => {
    update.mutate(
      {
        id: opp.id,
        patch: {
          stage,
          closed_at: stage === "ganado" || stage === "perdido" ? new Date().toISOString() : null,
          won_amount: stage === "ganado" ? opp.estimated_value : null,
        },
      },
      { onSuccess: () => toast.success(`Movido a ${STAGE_META[stage].label}`) },
    );
    addActivity.mutate({
      opportunity_id: opp.id,
      type: "cambio_etapa",
      content: `Etapa → ${STAGE_META[stage].label}`,
    });
  };

  const submitNote = () => {
    if (!note.trim()) return;
    addActivity.mutate(
      { opportunity_id: opp.id, type: "nota", content: note.trim() },
      { onSuccess: () => { setNote(""); toast.success("Nota guardada"); } },
    );
  };

  const submitTask = () => {
    if (!taskTitle.trim()) return;
    createTask.mutate(
      {
        title: taskTitle.trim(),
        opportunity_id: opp.id,
        client_id: opp.client_id ?? undefined,
        due_at: taskDue ? new Date(taskDue).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success("Tarea creada");
          addActivity.mutate({
            opportunity_id: opp.id,
            type: "tarea",
            content: `Tarea: ${taskTitle}${taskDue ? ` (vence ${taskDue})` : ""}`,
          });
          setTaskTitle("");
          setTaskDue("");
          setTaskOpen(false);
        },
      },
    );
  };

  const escalate = () => {
    update.mutate({
      id: opp.id,
      patch: {
        needs_human_escalation: true,
        escalation_reason: opp.escalation_reason || "Requiere especialista Grupo PSI",
      },
    });
    addActivity.mutate({
      opportunity_id: opp.id,
      type: "escalamiento",
      content: "Escalado a especialista humano",
    });
    toast.success("Escalado a humano");
  };

  return (
    <Dialog open={!!opp} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg flex items-center gap-2">
                {opp.created_by_sora && <Bot className="w-4 h-4 text-primary" />}
                {opp.title}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className={stageMeta.color}>{stageMeta.label}</Badge>
                <Badge variant="outline" className="border-white/10">{opp.source}</Badge>
                {opp.priority_line && <Badge variant="outline" className="border-white/10">{opp.priority_line}</Badge>}
                <span className={`text-xs font-semibold ${urg.color}`}>Urgencia: {urg.label}</span>
                {opp.needs_human_escalation && (
                  <Badge variant="outline" className="border-red-500/40 text-red-300 bg-red-500/10">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Escalado
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 pb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-[11px] uppercase text-muted-foreground">Valor estimado</p>
                <p className="font-bold text-lg">${Number(opp.estimated_value || 0).toLocaleString("es-MX")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase text-muted-foreground">Próxima acción</p>
                <p className="font-medium">{opp.next_action_at ? format(new Date(opp.next_action_at), "PPp", { locale: es }) : "—"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2 text-sm">
              <p className="text-[11px] uppercase text-muted-foreground font-semibold">Contacto</p>
              <div className="flex items-center gap-2"><UserCircle className="w-4 h-4 text-muted-foreground" />{opp.contact_name ?? "—"}</div>
              {opp.contact_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{opp.contact_phone}</div>}
              {opp.contact_email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{opp.contact_email}</div>}
            </div>

            {(opp.diagnostic_summary || opp.risk_notes || opp.normativa) && (
              <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2 text-sm">
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Diagnóstico</p>
                {opp.diagnostic_summary && <p>{opp.diagnostic_summary}</p>}
                {opp.risk_notes && <p><span className="text-muted-foreground">Riesgo: </span>{opp.risk_notes}</p>}
                {opp.normativa && <p><span className="text-muted-foreground">Normativa: </span>{opp.normativa}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] uppercase text-muted-foreground font-semibold">Cambiar etapa</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STAGE_META) as CrmOpportunity["stage"][]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={opp.stage === s ? "default" : "outline"}
                    onClick={() => setStage(s)}
                  >
                    {STAGE_META[s].label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase text-muted-foreground font-semibold">Bitácora</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTaskOpen((v) => !v)}>
                    <ClipboardList className="w-3.5 h-3.5 mr-1" />Tarea
                  </Button>
                  {!opp.needs_human_escalation && (
                    <Button size="sm" variant="outline" onClick={escalate}>
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />Escalar
                    </Button>
                  )}
                </div>
              </div>

              {taskOpen && (
                <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                  <Input placeholder="Título de la tarea" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  <Input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  <Button size="sm" onClick={submitTask}>Crear tarea</Button>
                </div>
              )}

              <Textarea
                placeholder="Agregar nota, llamada o comentario…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={submitNote} disabled={!note.trim() || addActivity.isPending}>
                <MessageSquare className="w-3.5 h-3.5 mr-1" />Guardar nota
              </Button>

              <div className="space-y-2 mt-3">
                {(activities.data ?? []).map((a) => (
                  <div key={a.id} className="rounded-md border border-border bg-card/30 p-3 text-sm">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span className="flex items-center gap-1 capitalize">
                        {a.created_by_sora ? <Sparkles className="w-3 h-3 text-primary" /> : <Calendar className="w-3 h-3" />}
                        {a.type.replace("_", " ")}
                      </span>
                      <span>{format(new Date(a.created_at), "PPp", { locale: es })}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{a.content}</p>
                  </div>
                ))}
                {!activities.isLoading && (activities.data ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin actividad aún.</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
