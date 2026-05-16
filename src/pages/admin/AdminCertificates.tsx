import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Upload, Download, RefreshCcw, ShieldOff, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SERVICE_LABEL, STATUS_LABEL, statusBadgeClass, ServiceType, CertStatus, requestDownload,
} from "@/lib/certificates";

export default function AdminCertificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [copyReqs, setCopyReqs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    equipment_id: "",
    service_type: "mantenimiento" as ServiceType,
    branch_name: "",
    issued_at: new Date().toISOString().slice(0, 10),
    valid_until: "",
    status: "vigente" as CertStatus,
    notes: "",
    pdfFile: null as File | null,
  });
  const { toast } = useToast();

  const fetchAll = async () => {
    const [c, cl, eq, cr] = await Promise.all([
      supabase.from("certificates").select("*").order("issued_at", { ascending: false }),
      supabase.from("clients").select("id, company_name").order("company_name"),
      supabase.from("equipment").select("id, serial_number, brand, model, client_id"),
      supabase.from("certificate_copy_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setCerts(c.data ?? []);
    setClients(cl.data ?? []);
    setEquipment(eq.data ?? []);
    setCopyReqs(cr.data ?? []);
  };
  useEffect(() => { fetchAll(); }, []);
  useRealtimeTable({ table: "certificates", onChange: fetchAll });
  useRealtimeTable({ table: "certificate_copy_requests", onChange: fetchAll });

  const filtered = useMemo(() => certs.filter((c) => {
    if (typeFilter !== "all" && c.service_type !== typeFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const client = clients.find((cl) => cl.id === c.client_id)?.company_name ?? "";
      if (!c.folio.toLowerCase().includes(s) && !client.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [certs, clients, search, typeFilter, statusFilter]);

  const openNew = () => {
    setEditId(null);
    setForm({
      client_id: "", equipment_id: "", service_type: "mantenimiento",
      branch_name: "", issued_at: new Date().toISOString().slice(0, 10),
      valid_until: "", status: "vigente", notes: "", pdfFile: null,
    });
    setDialogOpen(true);
  };

  const openEdit = (cert: any) => {
    setEditId(cert.id);
    setForm({
      client_id: cert.client_id ?? "",
      equipment_id: cert.equipment_id ?? "",
      service_type: cert.service_type,
      branch_name: cert.branch_name ?? "",
      issued_at: cert.issued_at,
      valid_until: cert.valid_until ?? "",
      status: cert.status,
      notes: cert.notes ?? "",
      pdfFile: null,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.client_id) { toast({ title: "Selecciona cliente", variant: "destructive" }); return; }
    setUploading(true);
    try {
      let pdf_url: string | undefined;
      if (form.pdfFile) {
        const path = `${form.client_id}/${Date.now()}-${form.pdfFile.name}`;
        const { error: upErr } = await supabase.storage.from("certificates").upload(path, form.pdfFile, { upsert: true });
        if (upErr) throw upErr;
        pdf_url = path;
      }
      const payload: any = {
        client_id: form.client_id,
        equipment_id: form.equipment_id || null,
        service_type: form.service_type,
        branch_name: form.branch_name || null,
        issued_at: form.issued_at,
        valid_until: form.valid_until || null,
        status: form.status,
        notes: form.notes || null,
      };
      if (pdf_url) payload.pdf_url = pdf_url;

      if (editId) {
        const { error } = await supabase.from("certificates").update(payload).eq("id", editId);
        if (error) throw error;
        toast({ title: "Certificado actualizado" });
      } else {
        const { error } = await supabase.from("certificates").insert(payload);
        if (error) throw error;
        toast({ title: "Certificado emitido" });
      }
      setDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const replacePdf = async (cert: any, file: File) => {
    const path = `${cert.client_id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, file, { upsert: true });
    if (upErr) { toast({ title: "Error", description: upErr.message, variant: "destructive" }); return; }
    const { error } = await supabase.from("certificates").update({ pdf_url: path }).eq("id", cert.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "PDF reemplazado" });
    fetchAll();
  };

  const revoke = async (cert: any) => {
    if (!confirm("¿Revocar este certificado?")) return;
    await supabase.from("certificates").update({ status: "revocado" }).eq("id", cert.id);
    toast({ title: "Certificado revocado" });
    fetchAll();
  };

  const download = async (cert: any) => {
    try {
      const url = await requestDownload(cert.id);
      window.open(url, "_blank");
    } catch (e: any) {
      toast({ title: "No se pudo descargar", description: e.message, variant: "destructive" });
    }
  };

  const verifyUrl = (token: string) => `${window.location.origin}/verificar/${token}`;
  const equipmentLabel = (id: string | null) => {
    if (!id) return "—";
    const e = equipment.find((x) => x.id === id);
    return e ? `${e.brand ?? ""} ${e.model ?? ""} ${e.serial_number ? "· " + e.serial_number : ""}`.trim() : "—";
  };

  const reqsFor = (certId: string) => copyReqs.filter((r) => r.certificate_id === certId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar folio o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(SERVICE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Estatus" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estatus</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Emitir certificado</Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" /> Certificados ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Folio</th>
                  <th className="text-left px-4 py-2 font-medium">Cliente</th>
                  <th className="text-left px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium">Emisión</th>
                  <th className="text-left px-4 py-2 font-medium">Vigencia</th>
                  <th className="text-left px-4 py-2 font-medium">Estatus</th>
                  <th className="text-left px-4 py-2 font-medium">Copias</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const reqs = reqsFor(c.id);
                  const paid = reqs.filter((r) => r.payment_status === "paid").length;
                  return (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelected(c)}>
                      <td className="px-4 py-3 font-mono text-xs">{c.folio}</td>
                      <td className="px-4 py-3">{clients.find((cl) => cl.id === c.client_id)?.company_name ?? "—"}</td>
                      <td className="px-4 py-3">{SERVICE_LABEL[c.service_type as ServiceType]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.issued_at}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.valid_until ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`rounded-sm ${statusBadgeClass(c.status)}`}>
                          {STATUS_LABEL[c.status as CertStatus]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{paid > 0 ? `${paid} pagada${paid > 1 ? "s" : ""}` : "—"}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin certificados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editId ? "Editar certificado" : "Emitir nuevo certificado"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, equipment_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map((cl) => <SelectItem key={cl.id} value={cl.id}>{cl.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de servicio *</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v as ServiceType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Equipo (opcional)</Label>
                <Select value={form.equipment_id || "__none"} onValueChange={(v) => setForm({ ...form, equipment_id: v === "__none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Sin equipo</SelectItem>
                    {equipment.filter((e) => e.client_id === form.client_id).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{equipmentLabel(e.id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sucursal/Base</Label>
                <Input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Emisión</Label>
                <Input type="date" value={form.issued_at} onChange={(e) => setForm({ ...form, issued_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vigencia</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estatus</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CertStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>PDF del certificado</Label>
              <Input type="file" accept="application/pdf"
                onChange={(e) => setForm({ ...form, pdfFile: e.target.files?.[0] ?? null })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={save} disabled={uploading} className="w-full">
              {uploading ? "Guardando..." : editId ? "Guardar cambios" : "Emitir certificado"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">{selected.folio}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`rounded-sm ${statusBadgeClass(selected.status)}`}>
                    {STATUS_LABEL[selected.status as CertStatus]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{SERVICE_LABEL[selected.service_type as ServiceType]}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <Field label="Cliente" value={clients.find((cl) => cl.id === selected.client_id)?.company_name ?? "—"} />
                  <Field label="Sucursal" value={selected.branch_name ?? "—"} />
                  <Field label="Equipo" value={equipmentLabel(selected.equipment_id)} />
                  <Field label="Emisión" value={selected.issued_at} />
                  <Field label="Vigencia" value={selected.valid_until ?? "—"} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">QR de verificación</p>
                  <a href={verifyUrl(selected.qr_token)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline">
                    <QrCode className="w-3.5 h-3.5" /> {verifyUrl(selected.qr_token)}
                  </a>
                </div>
                {selected.notes && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
                    <p className="text-xs">{selected.notes}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                  <Button size="sm" variant="outline" onClick={() => download(selected)} disabled={!selected.pdf_url}>
                    <Download className="w-4 h-4 mr-2" /> Descargar PDF
                  </Button>
                  <label className="cursor-pointer">
                    <input type="file" accept="application/pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) replacePdf(selected, f); }} />
                    <Button size="sm" variant="outline" className="w-full pointer-events-none">
                      <Upload className="w-4 h-4 mr-2" /> {selected.pdf_url ? "Reemplazar PDF" : "Subir PDF"}
                    </Button>
                  </label>
                  <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                    <RefreshCcw className="w-4 h-4 mr-2" /> Editar datos
                  </Button>
                  {selected.status !== "revocado" && (
                    <Button size="sm" variant="ghost" onClick={() => revoke(selected)} className="text-destructive hover:text-destructive">
                      <ShieldOff className="w-4 h-4 mr-2" /> Revocar
                    </Button>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Solicitudes de copia</p>
                  {reqsFor(selected.id).length === 0 && <p className="text-xs text-muted-foreground">Sin solicitudes</p>}
                  {reqsFor(selected.id).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 text-xs border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-MX")}</span>
                      <Badge variant="outline" className="rounded-sm text-[10px]">{r.payment_status}</Badge>
                      <span>${r.amount_mxn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="uppercase tracking-wide text-[10px] text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
