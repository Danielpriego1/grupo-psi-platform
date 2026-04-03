import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ShoppingBag, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const whatsappMsg = encodeURIComponent(
    `¡Hola! Acabo de realizar un pago en la tienda de Grupo PSI.${orderNumber ? ` Número de pedido: ${orderNumber}.` : ""} ¿Pueden confirmar mi pedido?`
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">¡Pago realizado!</h1>
            <p className="text-muted-foreground">
              Tu pago fue procesado exitosamente.
            </p>
            {orderNumber && (
              <div className="inline-block rounded-lg bg-primary/10 px-4 py-2 mt-2">
                <p className="text-sm text-muted-foreground">Número de pedido</p>
                <p className="text-lg font-bold text-primary">{orderNumber}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground text-left space-y-2">
            <p>✅ Tu pago fue confirmado por Stripe</p>
            <p>✅ Hemos registrado tu pedido en nuestro sistema</p>
            <p>📦 Nuestro equipo se pondrá en contacto contigo para coordinar la entrega</p>
            <p>📞 Contacto: +52 1 993 168 4717</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href={`https://wa.me/5219931684717?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full" variant="default">
                <MessageCircle className="h-4 w-4 mr-2" />
                Confirmar por WhatsApp
              </Button>
            </a>

            <Link to="/">
              <Button className="w-full" variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>

            <Link to="/catalogo">
              <Button className="w-full" variant="ghost" size="sm">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Seguir comprando
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
