import { useMemo, useState } from "react";
import {
  useOpportunities,
  useTasks,
  useUpdateOpportunity,
  useUpdateTask,
  useCreateOpportunity,
  STAGE_META,
  URGENCY_META,
  PIPELINE_ORDER,
  CrmOpportunity,
  CrmStage,
} from "@/hooks/useCrm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Bot, CheckCircle2, ClipboardList, Flame, Layers,
  Plus, Search, Sparkles, TrendingUp, Trophy, Users2, Clock, Phone,
} from "lucide-react";
import { OpportunityDetail } from "@/components/admin/crm/OpportunityDetail";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";

const PRIORITY_LINES = [
  "Extintores", "SCBA y equipos de escape rápido", "Detectores de gas portátiles y fijos",
  "Pruebas PosiChek", "Pruebas hidrostáticas", "Pruebas de pureza de aire",
  "Calibraciones", "Certificaciones", "Uniformes corporativos", "Bordado",
  "Equipo de protección personal", "Cascadas", "Motores aire grado D", "Cajas de filtración",
];

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: string }) {
  return (
    <Card className="p-4 bg-card/60 border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`text-2xl font-black mt-1 ${accent ?? "text-foreground"}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 opacity-30 ${accent ?? ""}`} strokeWidth={1.5} />
      </div>
    </Card>
  );
}

function OppCard({ opp, onOpen }: { opp: CrmOpportunity; onOpen: () => void }) {
  const urg = URGENCY_META[opp.urgency];
  return (
    <button
      onClick={onOpen}
      className="text-left w-full rounded-lg border border-border bg-card hover:bg-card/80 hover:border-primary/40 transition p-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        {opp.created_by_sora && <Bot className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />}
        <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1">{opp.title}</p>
      </div>
      {opp.contact_name && (
        <p className="text-xs text-muted-foreground truncate">{opp.contact_name}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-foreground">
          ${Number(opp.estimated_value || 0).toLocaleString("es-MX")}
        </span>
        <span className={`font-semibold ${urg.color}`}>{urg.label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {opp.priority_line && (
          <Badge variant="outline" className="text-[10px] border-white/10 px-1.5 py-0">
            {opp.priority_line.split(" ").slice(0, 3).join(" ")}
          </Badge>
        )}
        {opp.needs_human_escalation && (
          <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-300 bg-red-500/10 px-1.5 py-0">
            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Escalado
          </Badge>
        )}
      </div>
    </button>
  );
}

function NewOpportunityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateOpportunity();
  const [form, setForm] = useState({
    title: "", contact_name: "", contact_phone: "", contact_email: "",
    priority_line: "", urgency: "media", estimated_value: "", diagnostic_summary: "",
  });
  const submit = () => {
    if (!form.title.trim()) return toast.error("Título requerido");
    create.mutate(
      {
        title: form.title.trim(),
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        priority_line: form.priority_line || null,
        urgency: form.urgency as any,
        estimated_value: parseFloat(form.estimated_value) || 0,
        diagnostic_summary: form.diagnostic_summary || null,
        source: "manual" as any,
        stage: "nuevo" as any,
      },
      {
        onSuccess: () => {
          toast.success("Oportunidad creada");
          onOpenChange(false);
          setForm({ title: "", contact_name: "", contact_phone: "", contact_email: "", priority_line: "", urgency: "media", estimated_value: "", diagnostic_summary: "" });
        },
        onError: (e: any) => toast.error(e.message),
      },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nueva oportunidad</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Contacto</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Línea de negocio</Label>
              <Select value={form.priority_line} onValueChange={(v) => setForm({ ...form, priority_line: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PRIORITY_LINES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgencia</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(URGENCY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Valor estimado (MXN)</Label><Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} /></div>
          <div><Label>Diagnóstico / contexto</Label><Textarea rows={3} value={form.diagnostic_summary} onChange={(e) => setForm({ ...form, diagnostic_summary: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCRM() {
  const { data: opps = [], isLoading } = useOpportunities();
  const { data: tasks = [] } = useTasks();
  const update = useUpdateOpportunity();
  const updateTask = useUpdateTask();
  const [selected, setSelected] = useState<CrmOpportunity | null>(null);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return opps;
    return opps.filter((o) =>
      [o.title, o.contact_name, o.contact_email, o.priority_line]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
    );
  }, [opps, search]);

  const byStage = useMemo(() => {
    const m: Record<CrmStage, CrmOpportunity[]> = {
      nuevo: [], diagnostico: [], cotizado: [], negociacion: [], ganado: [], perdido: [],
    };
    filtered.forEach((o) => m[o.stage].push(o));
    return m;
  }, [filtered]);

  const activeOpps = opps.filter((o) => o.stage !== "ganado" && o.stage !== "perdido");
  const totalPipeline = activeOpps.reduce((s, o) => s + Number(o.estimated_value || 0), 0);
  const won = opps.filter((o) => o.stage === "ganado");
  const wonAmount = won.reduce((s, o) => s + Number(o.won_amount || o.estimated_value || 0), 0);
  const conversionRate = opps.length ? Math.round((won.length / opps.length) * 100) : 0;
  const escalations = opps.filter((o) => o.needs_human_escalation && o.stage !== "ganado" && o.stage !== "perdido");
  const soraLeads = opps.filter((o) => o.created_by_sora);

  // Top líneas de negocio
  const topLines = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    opps.forEach((o) => {
      const k = o.priority_line || "Sin clasificar";
      counts[k] ??= { count: 0, value: 0 };
      counts[k].count++;
      counts[k].value += Number(o.estimated_value || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1].value - a[1].value).slice(0, 6);
  }, [opps]);

  const onDrop = (stage: CrmStage) => {
    if (!draggedId) return;
    const opp = opps.find((o) => o.id === draggedId);
    if (!opp || opp.stage === stage) return setDraggedId(null);
    update.mutate(
      {
        id: draggedId,
        patch: {
          stage,
          closed_at: stage === "ganado" || stage === "perdido" ? new Date().toISOString() : null,
          won_amount: stage === "ganado" ? opp.estimated_value : null,
        },
      },
      { onSuccess: () => toast.success(`Movido a ${STAGE_META[stage].label}`) },
    );
    setDraggedId(null);
  };

  const pendingTasks = tasks.filter((t) => t.status === "pendiente" || t.status === "vencida");

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard icon={Layers} label="Pipeline activo" value={activeOpps.length} />
        <KpiCard icon={TrendingUp} label="Valor pipeline" value={`$${totalPipeline.toLocaleString("es-MX")}`} accent="text-primary" />
        <KpiCard icon={Trophy} label="Ganadas" value={`$${wonAmount.toLocaleString("es-MX")}`} accent="text-emerald-400" />
        <KpiCard icon={Sparkles} label="Leads Sora" value={soraLeads.length} accent="text-primary" />
        <KpiCard icon={AlertTriangle} label="Escalados" value={escalations.length} accent={escalations.length ? "text-red-400" : ""} />
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="pipeline"><Layers className="w-3.5 h-3.5 mr-1" />Pipeline</TabsTrigger>
            <TabsTrigger value="tasks"><ClipboardList className="w-3.5 h-3.5 mr-1" />Tareas ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="escalations"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Escalamientos ({escalations.length})</TabsTrigger>
            <TabsTrigger value="metrics"><TrendingUp className="w-3.5 h-3.5 mr-1" />Métricas</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 w-56" />
            </div>
            <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />Nueva</Button>
          </div>
        </div>

        <TabsContent value="pipeline" className="mt-0">
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {PIPELINE_ORDER.map((stage) => {
                const list = byStage[stage];
                const sum = list.reduce((s, o) => s + Number(o.estimated_value || 0), 0);
                return (
                  <div
                    key={stage}
                    className="w-72 shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(stage)}
                  >
                    <div className={`rounded-t-lg border border-b-0 border-border p-2.5 ${STAGE_META[stage].color}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wide">{STAGE_META[stage].label}</p>
                        <span className="text-xs font-semibold opacity-80">{list.length}</span>
                      </div>
                      <p className="text-[11px] opacity-70 mt-0.5">${sum.toLocaleString("es-MX")}</p>
                    </div>
                    <div className="rounded-b-lg border border-border bg-card/30 p-2 space-y-2 min-h-[400px]">
                      {list.map((opp) => (
                        <div
                          key={opp.id}
                          draggable
                          onDragStart={() => setDraggedId(opp.id)}
                          onDragEnd={() => setDraggedId(null)}
                        >
                          <OppCard opp={opp} onOpen={() => setSelected(opp)} />
                        </div>
                      ))}
                      {list.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">Sin oportunidades</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-0 space-y-2">
          {pendingTasks.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">Sin tareas pendientes 🎉</Card>
          )}
          {pendingTasks.map((t) => {
            const overdue = t.due_at && isPast(new Date(t.due_at));
            return (
              <Card key={t.id} className="p-3 flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => updateTask.mutate({ id: t.id, patch: { status: "completada", completed_at: new Date().toISOString() } })}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                </div>
                {t.due_at && (
                  <div className={`text-xs flex items-center gap-1 ${overdue ? "text-red-400" : "text-muted-foreground"}`}>
                    <Clock className="w-3 h-3" />
                    {format(new Date(t.due_at), "PP", { locale: es })}
                  </div>
                )}
                {t.opportunity_id && (
                  <Button size="sm" variant="ghost" onClick={() => {
                    const o = opps.find((x) => x.id === t.opportunity_id);
                    if (o) setSelected(o);
                  }}>Ver</Button>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="escalations" className="mt-0 space-y-2">
          {escalations.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">Sin casos escalados.</Card>
          )}
          {escalations.map((o) => (
            <Card key={o.id} className="p-4 border-red-500/30 bg-red-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{o.title}</p>
                    {o.created_by_sora && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{o.escalation_reason || "Requiere especialista"}</p>
                  <div className="flex gap-3 text-xs mt-2 text-muted-foreground">
                    {o.contact_name && <span>{o.contact_name}</span>}
                    {o.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{o.contact_phone}</span>}
                    {o.priority_line && <Badge variant="outline" className="text-[10px] border-white/10 px-1.5 py-0">{o.priority_line}</Badge>}
                  </div>
                </div>
                <Button size="sm" onClick={() => setSelected(o)}>Atender</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="metrics" className="mt-0 grid lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Flame className="w-4 h-4 text-primary" /><h3 className="font-bold">Top líneas de negocio</h3></div>
            <div className="space-y-2">
              {topLines.map(([line, { count, value }]) => {
                const max = topLines[0]?.[1].value || 1;
                const pct = (value / max) * 100;
                return (
                  <div key={line} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{line}</span>
                      <span className="font-bold">${value.toLocaleString("es-MX")} <span className="text-muted-foreground font-normal">({count})</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {topLines.length === 0 && <p className="text-xs text-muted-foreground">Aún sin datos.</p>}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Bot className="w-4 h-4 text-primary" /><h3 className="font-bold">Actividad de Sora</h3></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-black text-primary">{soraLeads.length}</p>
                <p className="text-[11px] text-muted-foreground uppercase">Leads generados</p>
              </div>
              <div>
                <p className="text-2xl font-black">{soraLeads.filter((o) => o.needs_human_escalation).length}</p>
                <p className="text-[11px] text-muted-foreground uppercase">Escalados</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">
                  {soraLeads.filter((o) => o.stage === "ganado").length}
                </p>
                <p className="text-[11px] text-muted-foreground uppercase">Convertidos</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Conversión global: <span className="font-bold text-foreground">{conversionRate}%</span></p>
            </div>
          </Card>

          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-primary" /><h3 className="font-bold">Distribución por etapa</h3></div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {PIPELINE_ORDER.map((s) => {
                const list = byStage[s];
                const val = list.reduce((sum, o) => sum + Number(o.estimated_value || 0), 0);
                return (
                  <div key={s} className={`rounded-lg border p-2.5 ${STAGE_META[s].color}`}>
                    <p className="text-[10px] uppercase font-bold">{STAGE_META[s].label}</p>
                    <p className="text-xl font-black mt-1">{list.length}</p>
                    <p className="text-[10px] opacity-80">${val.toLocaleString("es-MX")}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <OpportunityDetail opp={selected} onClose={() => setSelected(null)} />
      <NewOpportunityDialog open={newOpen} onOpenChange={setNewOpen} />

      {isLoading && <p className="text-xs text-muted-foreground">Cargando…</p>}
    </div>
  );
}
