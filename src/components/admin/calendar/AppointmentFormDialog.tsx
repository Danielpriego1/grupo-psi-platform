import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialDate?: Date | null;
  editing?: CalendarEvent | null;
  onSaved?: () => void;
}

export function AppointmentFormDialog({ open, onOpenChange, initialDate, editing, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    contact_name: "",
    contact_phone: "",
    appointment_type: "visit",
    scheduled_date: format(initialDate ?? new Date(), "yyyy-MM-dd"),
    scheduled_time: "09:00",
    duration_minutes: 60,
    address: "",
    state: "",
    municipality: "",
    notes: "",
    internal_notes: "",
  });

  useEffect(() => {
    if (!open) return;
    supabase.from("clients").select("id, company_name").order("company_name").then(({ data }) => {
      if (data) setClients(data);
    });
    if (editing && editing.source === "appointment") {
      const start = new Date(editing.start_at);
      setForm({
        client_id: editing.client_id ?? "",
        contact_name: "",
        contact_phone: editing.contact_phone ?? "",
        appointment_type: editing.event_type,
        scheduled_date: format(start, "yyyy-MM-dd"),
        scheduled_time: format(start, "HH:mm"),
        duration_minutes: Math.max(15, Math.round((new Date(editing.end_at).getTime() - start.getTime()) / 60000)),
        address: editing.address ?? "",
        state: editing.state ?? "",
        municipality: editing.municipality ?? "",
        notes: editing.notes ?? "",
        internal_notes: editing.internal_notes ?? "",
      });
    } else if (initialDate) {
      setForm((f) => ({ ...f, scheduled_date: format(initialDate, "yyyy-MM-dd") }));
    }
  }, [open, editing, initialDate]);

  const save = async () => {
    setSaving(true);
    const scheduled_at = new Date(`${form.scheduled_date}T${form.scheduled_time}:00`).toISOString();
    const payload = {
      client_id: form.client_id || null,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      appointment_type: form.appointment_type as any,
      scheduled_at,
      duration_minutes: Number(form.duration_minutes) || 60,
      address: form.address || null,
      state: form.state || null,
      municipality: form.municipality || null,
      notes: form.notes || null,
      internal_notes: form.internal_notes || null,
      created_by: user?.id ?? null,
    };
    const { error } = editing
      ? await supabase.from("appointments").update(payload).eq("id", editing.source_id)
      : await supabase.from("appointments").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Cita actualizada" : "Cita creada" });
    if (!editing) {
      const typeLabels: Record<string, string> = {
        visit: "Visita", inspection: "Inspección", pickup: "Recolección", meeting: "Reunión",
      };
      const clientName = clients.find((c) => c.id === form.client_id)?.company_name ?? "Sin cliente";
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "nueva-cita-agendada",
          idempotencyKey: `appointment-${scheduled_at}-${form.client_id || form.contact_phone}`,
          templateData: {
            appointmentType: typeLabels[form.appointment_type] ?? form.appointment_type,
            clientName,
            contactName: form.contact_name,
            contactPhone: form.contact_phone,
            scheduledDate: form.scheduled_date,
            scheduledTime: form.scheduled_time,
            durationMinutes: Number(form.duration_minutes) || 60,
            address: form.address,
            municipality: form.municipality,
            state: form.state,
            notes: form.notes,
          },
        },
      }).catch((e) => console.warn("notify email failed", e));
    }
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cita" : "Nueva cita"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.appointment_type} onValueChange={(v) => setForm({ ...form, appointment_type: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                  <SelectItem value="pickup">Recolección</SelectItem>
                  <SelectItem value="meeting">Reunión</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Fecha</Label>
              <Input type="date" className="h-9" value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Hora</Label>
              <Input type="time" className="h-9" value={form.scheduled_time}
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Duración (min)</Label>
              <Input type="number" min={15} step={15} className="h-9" value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Contacto</Label>
              <Input className="h-9" value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input className="h-9" value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Dirección</Label>
            <Input className="h-9" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Municipio</Label>
              <Input className="h-9" value={form.municipality}
                onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Input className="h-9" value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div>
            <Label className="text-xs">Notas internas</Label>
            <Textarea rows={2} value={form.internal_notes}
              onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
