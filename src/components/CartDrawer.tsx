import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();

  const BULK_THRESHOLD = 10;
  const isBulkOrder = items.some((i) => i.quantity >= BULK_THRESHOLD);

  // Build WhatsApp message from cart
  const buildWhatsAppMessage = (orderNumber?: string) => {
    let msg = orderNumber
      ? `¡Hola! Mi pedido ${orderNumber}. Me gustaría cotizar los siguientes productos:\n\n`
      : "¡Hola! Me gustaría cotizar los siguientes productos:\n\n";
    items.forEach((item, i) => {
      const price = item.product.discount
        ? item.product.priceOriginalMxn * (1 - item.product.discount)
        : item.product.priceOriginalMxn;
      msg += `${i + 1}. ${item.product.name}`;
      if (item.selectedSize) msg += ` — Talla: ${item.selectedSize}`;
      if (item.selectedVariant) msg += ` — Variante: ${item.selectedVariant}`;
      msg += ` x${item.quantity} ($${(price * item.quantity).toFixed(2)} MXN)\n`;
    });
    msg += `\nTotal estimado: $${totalPrice.toFixed(2)} MXN`;
    if (clientName) msg += `\n\nNombre: ${clientName}`;
    if (clientPhone) msg += `\nTeléfono: ${clientPhone}`;
    return encodeURIComponent(msg);
  };

  // Stripe checkout — real payment
  const handleStripeCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          items,
          clientName,
          clientPhone,
          successUrl: `${window.location.origin}/pago-exitoso`,
          cancelUrl: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No se recibió URL de pago");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
      clearCart();
    } catch (error: any) {
      console.error("Error en checkout:", error);
      toast({
        title: "Error al procesar pago",
        description: "Hubo un problema al iniciar el pago. Intenta de nuevo o cotiza por WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // WhatsApp quote — save to DB
  const handleQuoteRequest = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-quote-order", {
        body: { items, total: totalPrice, clientName, clientPhone },
      });
      if (error) throw error;
      const orderNumber = data?.orderNumber;
      toast({
        title: "Cotización registrada",
        description: `Tu pedido ${orderNumber} ha sido guardado. Te contactaremos pronto.`,
      });
      window.open(`https://wa.me/5219931684717?text=${buildWhatsAppMessage(orderNumber)}`, "_blank");
      clearCart();
      setClientName("");
      setClientPhone("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating quote:", error);
      window.open(`https://wa.me/5219931684717?text=${buildWhatsAppMessage()}`, "_blank");
      toast({
        title: "Cotización enviada",
        description: "Tu solicitud fue enviada por WhatsApp.",
        variant: "default",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Carrito ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Tu carrito está vacío</p>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Ver catálogo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => {
                const price = item.product.discount
                  ? item.product.priceOriginalMxn * (1 - item.product.discount)
                  : item.product.priceOriginalMxn;
                return (
                  <div key={item.product.id + (item.selectedSize || "")} className="flex gap-3 rounded-xl border border-border p-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted/30">
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-1">{item.product.name}</h4>
                      {item.selectedSize && (
                        <p className="text-xs text-muted-foreground">Talla: {item.selectedSize}</p>
                      )}
                      {item.selectedVariant && (
                        <p className="text-xs text-muted-foreground">Variante: {item.selectedVariant}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-primary">${(price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)} MXN</span>
              </div>

              {/* Bulk order alert */}
              {isBulkOrder && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="font-semibold text-primary mb-1">📦 Pedido por volumen detectado</p>
                  <p className="text-muted-foreground text-xs">
                    Para compras de {BULK_THRESHOLD}+ unidades, te recomendamos solicitar cotización especial
                    con descuentos por volumen y fechas de entrega personalizadas.
                  </p>
                </div>
              )}

              {/* Contact info */}
              <div className="space-y-2 pt-1">
                <Label htmlFor="clientName" className="text-xs text-muted-foreground">
                  Datos de contacto {isBulkOrder ? "(requerido para cotización)" : "(opcional)"}
                </Label>
                <Input
                  id="clientName"
                  placeholder="Tu nombre"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-9"
                />
                <Input
                  id="clientPhone"
                  placeholder="Tu teléfono"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Stripe Payment Button — shown for non-bulk orders */}
              {!isBulkOrder && (
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                  onClick={handleStripeCheckout}
                  disabled={isCheckingOut || isSubmitting}
                >
                  {isCheckingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {isCheckingOut ? "Procesando..." : `Pagar $${totalPrice.toFixed(2)} MXN`}
                </Button>
              )}

              {/* WhatsApp quote */}
              <Button
                variant={isBulkOrder ? "default" : "outline"}
                className="w-full"
                onClick={handleQuoteRequest}
                disabled={isSubmitting || isCheckingOut || (isBulkOrder && !clientName.trim())}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "💬"
                )}
                {isSubmitting
                  ? "Guardando..."
                  : isBulkOrder
                  ? "Solicitar cotización por volumen"
                  : "Cotizar por WhatsApp"}
              </Button>

              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={clearCart}>
                Vaciar carrito
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
