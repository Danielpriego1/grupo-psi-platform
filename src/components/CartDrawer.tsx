import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getProductPrice } from "@/data/products";
import { CartLineRow } from "@/components/cart/CartLineRow";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, clearCart, totalItems, totalPrice } = useCart();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const BULK_THRESHOLD = 10;
  const isBulkOrder = items.some((i) => i.quantity >= BULK_THRESHOLD);

  // Fetch live inventory stock for every product currently in the cart so we can
  // gate +/- controls and the checkout button against the real available stock.
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const ids = [...new Set(items.map((i) => i.product.id))];
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("inventory")
        .select("product_id, stock")
        .in("product_id", ids);
      if (cancelled || !data) return;
      const map: Record<string, number> = {};
      for (const row of data) map[row.product_id] = Number(row.stock);
      setStockByProduct(map);
    })();
    return () => { cancelled = true; };
  }, [isOpen, items]);

  // Aggregate demand per product across all cart lines (variants share the same
  // pool). Line is "over stock" if the sum of its product's quantities exceeds
  // available inventory.
  const demandByProduct = useMemo(() => {
    const d: Record<string, number> = {};
    for (const i of items) d[i.product.id] = (d[i.product.id] || 0) + i.quantity;
    return d;
  }, [items]);

  const stockIssues = items.filter((i) => {
    const stock = stockByProduct[i.product.id];
    return stock != null && demandByProduct[i.product.id] > stock;
  });
  const hasStockIssue = stockIssues.length > 0;

  // Build WhatsApp message from cart
  const buildWhatsAppMessage = (orderNumber?: string) => {
    let msg = orderNumber
      ? `¡Hola! Mi pedido ${orderNumber}. Me gustaría cotizar los siguientes productos:\n\n`
      : "¡Hola! Me gustaría cotizar los siguientes productos:\n\n";
    items.forEach((item, i) => {
      const base = getProductPrice(item.product, item.selectedSize);
      const price = item.product.discount ? base * (1 - item.product.discount) : base;
      const hasSizes = !!item.product.sizes && Object.values(item.product.sizes).flat().length > 0;
      const colorKey = item.product.variants
        ? Object.keys(item.product.variants).find((k) => /color/i.test(k))
        : undefined;
      const hasColors = !!colorKey && (item.product.variants?.[colorKey!]?.length || 0) > 0;
      msg += `${i + 1}. ${item.product.name}`;
      if (hasSizes) msg += ` — Talla: ${item.selectedSize || "—"}`;
      if (hasColors) msg += ` — Color: ${item.selectedVariant || "—"}`;
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
                const lineKey = `${item.product.id}|${item.selectedSize || ""}|${item.selectedVariant || ""}`;
                // Live stock minus what other lines of the same product already claim
                const productStock = stockByProduct[item.product.id];
                const otherDemand = (demandByProduct[item.product.id] || 0) - item.quantity;
                const lineStock = productStock != null ? Math.max(0, productStock - otherDemand) : undefined;
                return <CartLineRow key={lineKey} item={item} liveStock={lineStock} />;
              })}
            </div>


            {/* Footer */}
            <div className="border-t border-border pt-4 space-y-3">
              {hasStockIssue && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive"
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Hay {stockIssues.length} línea{stockIssues.length === 1 ? "" : "s"} con
                    cantidad mayor al stock disponible. Ajusta las cantidades marcadas para continuar.
                  </span>
                </div>
              )}

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
                  size="storeCta"
                  onClick={handleStripeCheckout}
                  disabled={isCheckingOut || isSubmitting || hasStockIssue}
                >
                  {isCheckingOut ? (
                    <Loader2 className="mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2" />
                  )}
                  <span className="inline-block">
                    {isCheckingOut ? "Procesando..." : `Pagar $${totalPrice.toFixed(2)} MXN`}
                  </span>
                </Button>
              )}

              {/* WhatsApp quote */}
              <Button
                variant={isBulkOrder ? "default" : "outline"}
                size="storeCta"
                onClick={handleQuoteRequest}
                disabled={isSubmitting || isCheckingOut || hasStockIssue || (isBulkOrder && !clientName.trim())}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <span className="mr-2" aria-hidden>💬</span>
                )}
                <span className="inline-block">
                  {isSubmitting
                    ? "Guardando..."
                    : isBulkOrder
                    ? "Solicitar cotización por volumen"
                    : "Cotizar por WhatsApp"}
                </span>
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
