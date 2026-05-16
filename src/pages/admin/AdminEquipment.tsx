import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { Plus, Search, Wrench, Download, Printer, RefreshCcw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QrCode, downloadQrPng, buildQrUrl } from "@/components/qr/QrCode";

const TYPES: Record<string, string> = {
  scba: "SCBA",
  cilindro: "Cilindro",
  compresor: "Compresor",
  mascara: "Máscara",
  otro: "Otro",
};

export default function AdminEquipment() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: "", equipment_type: "scba", serial_number: "",
    brand: "", model: "", branch_name: "", notes: "",
  });
  const { toast } = useToast();

  const fetchAll = async () => {
    const [e, cl] = await Promise.all([
      supabase.from("equipment").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, company_name").order("company_name"),
    ]);
    setItems(e.data ?? []);
    setClients(cl.data ?? []);
  };
  useEffect(() => { fetchAll(); }, []);
  useRealtimeTable({ table: "equipment", onChange: fetchAll });

  const filtered = useMemo(() => items.filter((it) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const cl = clients.find((c) => c.id === it.client_id)?.company_name ?? "";
    return cl.toLowerCase().includes(s) || it.serial_number?.toLowerCase().includes(s) || it.brand?.toLowerCase().includes(s) || it.model?.toLowerCase().includes(s);
  }), [items, clients, search]);

  const openNew = () => {
    setEditId(null);
    setForm({ client_id: "", equipment_type: "scba", serial_number: "", brand: "", model: "", branch_name: "", notes: "" });
    setDialogOpen(true);
  };
  const openEdit = (it: any) => {
    setEditId(it.id);
    setForm({
      client_id: it.client_id, equipment_type: it.equipment_type, serial_number: it.serial_number ?? "",
      brand: it.brand ?? "", model: it.model ?? "", branch_name: it.branch_name ?? "", notes: it.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.client_id) { toast({ title: "Selecciona cliente", variant: "destructive" }); return; }
    const payload = { ...form, serial_number: form.serial_number || null, brand: form.brand || null, model: form.model || null, branch_name: form.branch_name || null, notes: form.notes || null };
    if (editId) {
      const { error } = await supabase.from("equipment").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Equipo actualizado" });
    } else {
      const { error } = await supabase.from("equipment").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Equipo registrado" });
    }
    setDialogOpen(false);
    fetchAll();
  };

  const regenerateQr = async (it: any) => {
    if (!confirm("Regenerar QR invalidará el código impreso anterior. ¿Continuar?")) return;
    const { error } = await supabase.rpc("regenerate_equipment_qr", { _id: it.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "QR regenerado" });
    fetchAll();
    if (selected?.id === it.id) setSelected({ ...it });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, serie o marca..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo equipo</Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Wrench className="w-4 h-4" /> Equipos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Cliente</th>
                  <th className="text-left px-4 py-2 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2 font-medium">Serie</th>
                  <th className="text-left px-4 py-2 font-medium">Marca / Modelo</th>
                  <th className="text-left px-4 py-2 font-medium">Sucursal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-b border-border/40 hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(it)}>
                    <td className="px-4 py-3">{clients.find((c) => c.id === it.client_id)?.company_name ?? "—"}</td>
                    <td className="px-4 py-3">{TYPES[it.equipment_type] ?? it.equipment_type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{it.serial_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{[it.brand, it.model].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.branch_name ?? "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin equipos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar equipo" : "Nuevo equipo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map((cl) => <SelectItem key={cl.id} value={cl.id}>{cl.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Serie</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Sucursal / Base</Label><Input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={save} className="w-full">{editId ? "Guardar cambios" : "Registrar equipo"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{TYPES[selected.equipment_type]} · {selected.serial_number ?? "Sin serie"}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-md border border-border/60">
                  <QrCode value={buildQrUrl("equipo", selected.qr_token)} size={180} />
                  <a href={buildQrUrl("equipo", selected.qr_token)} target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Abrir verificación
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadQrPng(buildQrUrl("equipo", selected.qr_token), `equipo-${selected.serial_number ?? selected.id}`)}>
                    <Download className="w-4 h-4 mr-2" /> PNG
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/qr-print?kind=equipo&ids=${selected.id}`} target="_blank">
                      <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Link>
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => regenerateQr(selected)} className="w-full">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Regenerar QR
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(selected)} className="w-full">
                  Editar datos
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
