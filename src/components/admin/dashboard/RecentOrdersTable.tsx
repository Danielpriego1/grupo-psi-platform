import { useState } from "react";
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
import { BentoCard } from "./BentoCard";

export interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  clients?: { company_name?: string } | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_progress: "En proceso",
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
      <BentoCard>
        <h4
          className="font-bold text-slate-900 text-base mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Pedidos recientes
        </h4>
        {orders.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No hay pedidos activos</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{o.order_number}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {o.clients?.company_name ?? "Sin cliente"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {fmtMoney(Number(o.total))}
                  </span>
                  <Badge variant="outline" className={statusStyles[o.status] ?? ""}>
                    {statusLabels[o.status] ?? o.status}
                  </Badge>
                  {o.status !== "cancelled" && o.status !== "delivered" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
      </BentoCard>

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
