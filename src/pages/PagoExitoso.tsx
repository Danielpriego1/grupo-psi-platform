import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, MessageCircle, Home, Loader2, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = searchParams.get("order") || "";
  const [ticketToken, setTicketToken] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  // Poll for ticket_token (set by webhook once payment confirmed)
  useEffect(() => {
    if (!orderNumber) {
      setPolling(false);
      return;
    }
    let attempts = 0;
    const maxAttempts = 20; // ~40s
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from("orders")
        .select("ticket_token")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (data?.ticket_token) {
        setTicketToken(data.ticket_token);
        setPolling(false);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  // Auto-redirect to ticket as soon as we have it
  useEffect(() => {
    if (ticketToken) {
      const t = setTimeout(() => navigate(`/ticket/${ticketToken}`), 1200);
      return () => clearTimeout(t);
    }
  }, [ticketToken, navigate]);

  const whatsappMsg = encodeURIComponent(
    `¡Hola! Acabo de realizar un pago en la tienda de Grupo PSI.${orderNumber ? ` Número de pedido: ${orderNumber}.` : ""} ¿Pueden confirmar mi pedido?`
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">¡Pago realizado!</h1>
            <p className="text-muted-foreground">Tu pago fue procesado exitosamente.</p>
            {orderNumber && (
              <div className="inline-block rounded-lg bg-primary/10 px-4 py-2 mt-2">
                <p className="text-sm text-muted-foreground">Número de pedido</p>
                <p className="text-lg font-bold text-primary">{orderNumber}</p>
              </div>
            )}
          </div>

          {polling && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando tu ticket con QR...
            </div>
          )}

          {ticketToken && (
            <Link to={`/ticket/${ticketToken}`}>
              <Button className="w-full" variant="default">
                <TicketIcon className="h-4 w-4 mr-2" />
                Ver mi ticket con QR
              </Button>
            </Link>
          )}

          {!polling && !ticketToken && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground text-left space-y-2">
              <p>✅ Tu pago fue recibido</p>
              <p>📦 Estamos confirmando con el procesador de pagos</p>
              <p>Tu ticket estará disponible en breve. Si no aparece, contáctanos por WhatsApp.</p>
            </div>
          )}

          <div className="space-y-3">
            <a href={`https://wa.me/5219931684717?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
              <Button className="w-full" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Confirmar por WhatsApp
              </Button>
            </a>

            <Link to="/">
              <Button className="w-full" variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
