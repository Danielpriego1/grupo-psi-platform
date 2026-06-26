import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, MessageCircle, Home, Loader2, Ticket as TicketIcon, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  product_name: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Summary {
  order: {
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    paid_at: string | null;
    created_at: string;
    ticket_token: string | null;
    stripe_session_id: string | null;
  };
  client: { name: string; phone: string; email: string | null };
  payment: { method: string; stripe_status: string | null; amount_total: number | null; currency: string | null };
  items: OrderItem[];
}

const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id") || "";
  const orderParam = searchParams.get("order") || "";

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketToken, setTicketToken] = useState<string | null>(null);

  // Fetch summary, polling until paid + ticket_token ready
  useEffect(() => {
    if (!sessionId && !orderParam) {
      setLoading(false);
      setError("Falta información del pedido en la URL.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    let cancelled = false;

    const tick = async () => {
      attempts++;
      try {
        const qs = new URLSearchParams();
        if (sessionId) qs.set("session_id", sessionId);
        if (orderParam) qs.set("order_number", orderParam);
        const { data, error: fnError } = await supabase.functions.invoke(
          `get-checkout-summary?${qs.toString()}`,
          { method: "GET" }
        );
        if (cancelled) return;
        if (fnError) throw fnError;
        if (data?.order) {
          setSummary(data as Summary);
          setLoading(false);
          if (data.order.ticket_token) setTicketToken(data.order.ticket_token);
          // Keep polling while payment not yet confirmed by webhook
          if (data.order.payment_status === "paid" && data.order.ticket_token) return;
        }
      } catch (e: any) {
        if (attempts === 1) setError(e?.message || "No se pudo cargar el resumen.");
      }
      if (!cancelled && attempts < maxAttempts) {
        setTimeout(tick, 2500);
      } else if (!cancelled) {
        setLoading(false);
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [sessionId, orderParam]);

  const orderNumber = summary?.order.order_number || orderParam;
  const isPaid = summary?.order.payment_status === "paid";

  const whatsappMsg = encodeURIComponent(
    `¡Hola! Acabo de realizar un pago en la tienda de Grupo PSI.${orderNumber ? ` Número de pedido: ${orderNumber}.` : ""} ¿Pueden confirmar mi pedido?`
  );

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-12">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <Card className="border-border">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="h-14 w-14 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">¡Pago confirmado!</h1>
              <p className="text-muted-foreground">Gracias por tu compra en Grupo PSI.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {orderNumber && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  Pedido {orderNumber}
                </Badge>
              )}
              {summary && (
                <Badge variant={isPaid ? "default" : "outline"} className="px-3 py-1">
                  {isPaid ? "Pagado" : "Procesando"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="border-border">
          <CardContent className="pt-6 pb-6 space-y-5">
            <h2 className="font-semibold text-lg text-foreground">Resumen del pedido</h2>

            {loading && !summary ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : error && !summary ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : summary ? (
              <>
                <div className="space-y-3">
                  {summary.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay productos asociados a este pedido.</p>
                  )}
                  {summary.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{it.product_name}</p>
                        <p className="text-muted-foreground">
                          {it.quantity} × {currency(Number(it.unit_price))}
                        </p>
                      </div>
                      <p className="font-medium text-foreground whitespace-nowrap">
                        {currency(Number(it.subtotal ?? it.unit_price * it.quantity))}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total (IVA incluido)</span>
                  <span className="text-xl font-bold text-primary">{currency(summary.order.total)}</span>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Cliente</p>
                    <p className="font-medium text-foreground">{summary.client.name || "—"}</p>
                    {summary.client.phone && <p className="text-muted-foreground">{summary.client.phone}</p>}
                    {summary.client.email && <p className="text-muted-foreground">{summary.client.email}</p>}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Método de pago
                    </p>
                    <p className="font-medium text-foreground">Tarjeta vía Stripe</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(summary.order.paid_at || summary.order.created_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Ticket QR */}
        <Card className="border-border">
          <CardContent className="pt-6 pb-6 space-y-3">
            {!isPaid && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirmando el pago con el procesador...
              </div>
            )}

            {ticketToken ? (
              <Link to={`/ticket/${ticketToken}`} className="block">
                <Button size="storeCta" variant="default">
                  <TicketIcon className="mr-2" />
                  Ver mi ticket con QR
                </Button>
              </Link>
            ) : isPaid ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando tu ticket con QR...
              </div>
            ) : null}

            <a
              href={`https://wa.me/5219931684717?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="storeCta" variant="outline">
                <MessageCircle className="mr-2" />
                Confirmar por WhatsApp
              </Button>
            </a>

            <Link to="/">
              <Button className="w-full" variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
