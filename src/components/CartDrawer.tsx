import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, ShoppingBag, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleQuoteRequest = async () => {
    setIsSubmitting(true);
    try {
      // Save quote to database
      const { data, error } = await supabase.functions.invoke("create-quote-order", {
        body: {
          items,
          total: totalPrice,
          clientName,
          clientPhone,
        },
      });

      if (error) throw error;

      const orderNumber = data?.orderNumber;

      toast({
        title: "Cotización registrada",
        description: `Tu pedido ${orderNumber} ha sido guardado. Te contactaremos pronto.`,
      });

      // Open WhatsApp with order number
      window.open(
        `https://wa.me/5219931684717?text=${buildWhatsAppMessage(orderNumber)}`,
        "_blank"
      );

      clearCart();
      setClientName("");
      setClientPhone("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating quote:", error);
      // Fallback: open WhatsApp without saving
      window.open(
        `https://wa.me/5219931684717?text=${buildWhatsAppMessage()}`,
        "_blank"
      );
      toast({
        title: "Cotización enviada",
        description: "Tu solicitud fue enviada por WhatsApp.",
        variant: "default",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if all items have purchaseUrl for direct Stripe checkout
  const stripeItems = items.filter((i) => i.product.purchaseUrl);
  const BULK_THRESHOLD = 10;
  const isBulkOrder = items.some((i) => i.quantity >= BULK_THRESHOLD);

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

              {/* Stripe checkout for products with purchaseUrl - only for non-bulk */}
              {!isBulkOrder && stripeItems.length > 0 && stripeItems.length === items.length && (
                <div className="space-y-2">
                  {items.map((item) => (
                    <a
                      key={item.product.id}
                      href={item.product.purchaseUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="default" className="w-full text-sm" size="sm">
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Pagar {item.product.name.substring(0, 30)}…
                      </Button>
                    </a>
                  ))}
                </div>
              )}

              {/* Client info for quote */}
              <div className="space-y-2 pt-2 border-t border-border/50">
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

              {/* WhatsApp cotización - now saves to DB */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleQuoteRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  "💬"
                )}
                {isSubmitting ? "Guardando..." : "Cotizar por WhatsApp"}
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
