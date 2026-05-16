import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type OrderStatus = Database["public"]["Enums"]["order_status"];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LocationPicker } from "@/components/admin/LocationPicker";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_progress: "En Proceso",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-primary/10 text-primary",
  ready: "bg-green-500/10 text-green-500",
  delivered: "bg-green-600/10 text-green-600",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postalCodeTouched, setPostalCodeTouched] = useState(false);
  const [newOrder, setNewOrder] = useState({
    client_id: "",
    notes: "",
    total: "",
    street: "",
    exterior_number: "",
    neighborhood: "",
    postal_code: "",
    state: "",
    municipality: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, clients(company_name)")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, company_name").order("company_name");
    setClients(data ?? []);
  };

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const createOrder = async () => {
    if (newOrder.latitude == null || newOrder.longitude == null) {
      toast({
        title: "Ubicación requerida",
        description: "Marca la ubicación en el mapa antes de guardar el pedido.",
        variant: "destructive",
      });
      return;
    }
    if (!/^\d{5}$/.test(newOrder.postal_code.trim())) {
      toast({
        title: "Código postal inválido",
        description: "El código postal debe tener exactamente 5 dígitos.",
        variant: "destructive",
      });
      return;
    }
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.functions.invoke("create-admin-order", {
      body: {
        order_number: orderNumber,
        client_id: newOrder.client_id || null,
        total: parseFloat(newOrder.total) || 0,
        notes: newOrder.notes,
        street: newOrder.street,
        exterior_number: newOrder.exterior_number,
        neighborhood: newOrder.neighborhood,
        postal_code: newOrder.postal_code,
        state: newOrder.state,
        municipality: newOrder.municipality,
        latitude: newOrder.latitude,
        longitude: newOrder.longitude,
      },
    });
    const serverError = (data as any)?.error || (data as any)?.message;
    if (error || (data as any)?.success === false) {
      toast({
        title: serverError ? "No se pudo crear el pedido" : "Error",
        description: serverError || error?.message || "Error desconocido",
        variant: "destructive",
      });
    } else {
      toast({ title: "Pedido creado", description: `#${orderNumber}` });
      setDialogOpen(false);
      setNewOrder({
        client_id: "",
        notes: "",
        total: "",
        street: "",
        exterior_number: "",
        neighborhood: "",
        postal_code: "",
        state: "",
        municipality: "",
        latitude: null,
        longitude: null,
      });
      fetchOrders();
    }
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    fetchOrders();
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.clients?.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? o.status !== "cancelled"
        : o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nuevo Pedido</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Pedido</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={newOrder.client_id} onValueChange={(v) => setNewOrder({ ...newOrder, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total (MXN)</Label>
                <Input
                  type="number"
                  value={newOrder.total}
                  onChange={(e) => setNewOrder({ ...newOrder, total: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={newOrder.state}
                    onChange={(e) => setNewOrder({ ...newOrder, state: e.target.value })}
                    placeholder="Tabasco"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Municipio</Label>
                  <Input
                    value={newOrder.municipality}
                    onChange={(e) => setNewOrder({ ...newOrder, municipality: e.target.value })}
                    placeholder="Nacajuca"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Calle</Label>
                  <Input
                    value={newOrder.street}
                    onChange={(e) => setNewOrder({ ...newOrder, street: e.target.value })}
                    placeholder="Av. Juárez"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={newOrder.exterior_number}
                    onChange={(e) => setNewOrder({ ...newOrder, exterior_number: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Colonia</Label>
                  <Input
                    value={newOrder.neighborhood}
                    onChange={(e) => setNewOrder({ ...newOrder, neighborhood: e.target.value })}
                    placeholder="Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código postal <span className="text-destructive">*</span></Label>
                  <Input
                    value={newOrder.postal_code}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        postal_code: e.target.value.replace(/\D/g, "").slice(0, 5),
                      })
                    }
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text");
                      const normalized = pasted.replace(/\D/g, "").slice(0, 5);
                      setNewOrder((prev) => ({ ...prev, postal_code: normalized }));
                    }}
                    placeholder="86000"
                    inputMode="numeric"
                    maxLength={5}
                    onBlur={() => setPostalCodeTouched(true)}
                    aria-invalid={
                      (postalCodeTouched || newOrder.postal_code.length > 0) &&
                      !/^\d{5}$/.test(newOrder.postal_code)
                    }
                    className={
                      newOrder.postal_code.length === 0
                        ? postalCodeTouched
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                        : /^\d{5}$/.test(newOrder.postal_code)
                          ? "border-green-500 focus-visible:ring-green-500"
                          : "border-destructive focus-visible:ring-destructive"
                    }
                  />
                  {newOrder.postal_code.length === 0 ? (
                    postalCodeTouched ? (
                      <p className="text-xs text-destructive">
                        El código postal es obligatorio.
                      </p>
                    ) : null
                  ) : /^\d{5}$/.test(newOrder.postal_code) ? (
                    <p className="text-xs text-green-600">✓ Código postal válido.</p>
                  ) : (
                    <p className="text-xs text-destructive">
                      Debe tener exactamente 5 dígitos ({newOrder.postal_code.length}/5).
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Ubicación en mapa <span className="text-destructive">*</span>
                </Label>
                <LocationPicker
                  latitude={newOrder.latitude}
                  longitude={newOrder.longitude}
                  onChange={({ latitude, longitude }) =>
                    setNewOrder((prev) => ({ ...prev, latitude, longitude }))
                  }
                  onAddressResolved={({ street, houseNumber, neighborhood, state, municipality, postalCode }) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      street: prev.street || street || "",
                      exterior_number: prev.exterior_number || houseNumber || "",
                      neighborhood: prev.neighborhood || neighborhood || "",
                      postal_code: prev.postal_code || postalCode || "",
                      state: prev.state || state || "",
                      municipality: prev.municipality || municipality || "",
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
              <Button
                onClick={createOrder}
                className="w-full"
                disabled={
                  newOrder.latitude == null ||
                  newOrder.longitude == null ||
                  !/^\d{5}$/.test(newOrder.postal_code)
                }
              >
                {newOrder.latitude == null || newOrder.longitude == null
                  ? "Marca la ubicación en el mapa"
                  : !/^\d{5}$/.test(newOrder.postal_code)
                  ? "Código postal inválido"
                  : "Crear Pedido"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Pedidos ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay pedidos</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{order.order_number}</p>
                      <Badge className={statusColors[order.status]} variant="secondary">
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.clients?.company_name ?? "Sin cliente"}</p>
                    {order.notes && <p className="text-xs text-muted-foreground">{order.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">
                      ${Number(order.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
