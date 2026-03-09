import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_transit: "En Tránsito",
  delivered: "Entregado",
  failed: "Fallido",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  assigned: "bg-blue-500/10 text-blue-500",
  in_transit: "bg-primary/10 text-primary",
  delivered: "bg-green-500/10 text-green-500",
  failed: "bg-destructive/10 text-destructive",
};

export default function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    order_id: "",
    assigned_driver: "",
    delivery_address: "",
    scheduled_date: "",
    notes: "",
  });
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, clients(company_name))")
      .order("created_at", { ascending: false });
    setDeliveries(data ?? []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("id, order_number").order("created_at", { ascending: false });
    setOrders(data ?? []);
  };

  useEffect(() => {
    fetchDeliveries();
    fetchOrders();
  }, []);

  const createDelivery = async () => {
    if (!newDelivery.order_id) {
      toast({ title: "Selecciona un pedido", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("deliveries").insert({
      order_id: newDelivery.order_id,
      assigned_driver: newDelivery.assigned_driver || null,
      delivery_address: newDelivery.delivery_address || null,
      scheduled_date: newDelivery.scheduled_date || null,
      notes: newDelivery.notes || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entrega creada" });
      setDialogOpen(false);
      setNewDelivery({ order_id: "", assigned_driver: "", delivery_address: "", scheduled_date: "", notes: "" });
      fetchDeliveries();
    }
  };

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    const update: any = { status };
    if (status === "delivered") update.delivered_at = new Date().toISOString();
    await supabase.from("deliveries").update(update).eq("id", id);
    fetchDeliveries();
  };

  const filtered = deliveries.filter(
    (d) =>
      d.orders?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.assigned_driver?.toLowerCase().includes(search.toLowerCase()) ||
      d.orders?.clients?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar entrega..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nueva Entrega</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Programar Entrega</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pedido</Label>
                <Select value={newDelivery.order_id} onValueChange={(v) => setNewDelivery({ ...newDelivery, order_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar pedido" /></SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chofer / Responsable</Label>
                <Input value={newDelivery.assigned_driver} onChange={(e) => setNewDelivery({ ...newDelivery, assigned_driver: e.target.value })} placeholder="Nombre del chofer" />
              </div>
              <div className="space-y-2">
                <Label>Dirección de entrega</Label>
                <Textarea value={newDelivery.delivery_address} onChange={(e) => setNewDelivery({ ...newDelivery, delivery_address: e.target.value })} placeholder="Dirección completa" />
              </div>
              <div className="space-y-2">
                <Label>Fecha programada</Label>
                <Input type="date" value={newDelivery.scheduled_date} onChange={(e) => setNewDelivery({ ...newDelivery, scheduled_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={newDelivery.notes} onChange={(e) => setNewDelivery({ ...newDelivery, notes: e.target.value })} placeholder="Instrucciones especiales..." />
              </div>
              <Button onClick={createDelivery} className="w-full">Crear Entrega</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Truck className="w-5 h-5" />Entregas ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay entregas programadas</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((d) => (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{d.orders?.order_number}</p>
                      <Badge className={statusColors[d.status]} variant="secondary">{statusLabels[d.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.orders?.clients?.company_name ?? "—"}</p>
                    {d.assigned_driver && <p className="text-xs text-muted-foreground">🚛 {d.assigned_driver}</p>}
                    {d.scheduled_date && <p className="text-xs text-muted-foreground">📅 {d.scheduled_date}</p>}
                  </div>
                  <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v as DeliveryStatus)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
