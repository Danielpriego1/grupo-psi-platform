import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  clients?: { company_name?: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-primary/10 text-primary",
  ready: "bg-green-500/10 text-green-500",
  delivered: "bg-green-600/10 text-green-600",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_progress: "En Proceso",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function RecentOrdersTable({ orders, onChanged }: { orders: OrderRow[]; onChanged: () => void }) {
  const [pending, setPending] = useState<OrderRow | null>(null);

  const cancelOrder = async () => {
    if (!pending) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", pending.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pedido cancelado", description: pending.order_number });
      onChanged();
    }
    setPending(null);
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-base">Pedidos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay pedidos activos</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.clients?.company_name ?? "Sin cliente"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">{fmtMoney(Number(o.total))}</span>
                    <Badge className={statusColors[o.status] ?? ""} variant="secondary">
                      {statusLabels[o.status] ?? o.status}
                    </Badge>
                    {o.status !== "cancelled" && o.status !== "delivered" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setPending(o)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Se marcará <strong>{pending?.order_number}</strong> como cancelado. Esta acción se puede revertir
              desde la vista de pedidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={cancelOrder} className="bg-destructive hover:bg-destructive/90">
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
