import { useParams, Link } from "react-router-dom";
import { getProductById } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  ShoppingCart,
  Truck,
  Wrench,
  ArrowLeft,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";

const ProductDetail = () => {
  const { id } = useParams();
  const product = getProductById(id || "");
  const [date, setDate] = useState<Date>();
  const [serviceType, setServiceType] = useState<"delivery" | "maintenance">("delivery");
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.discount && product.discount > 0;
  const finalPrice = hasDiscount
    ? product.priceOriginalMxn * (1 - product.discount!)
    : product.priceOriginalMxn;

  const handleAddToCart = () => {
    toast.success(`${product.name} agregado al carrito`, {
      description: date
        ? `${serviceType === "delivery" ? "Entrega" : "Mantenimiento"} programado: ${format(date, "PPP", { locale: es })}`
        : "Sin fecha programada",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>

        <div className="mt-6 flex flex-col gap-10 lg:flex-row">
          {/* Left: Gallery */}
          <div className="flex-1 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-secondary/20">
              <div className="aspect-[4/3] p-8 md:p-12">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Description section */}
            <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6 md:p-8">
              <div>
                <h2 className="text-xl font-bold">Descripción del producto</h2>
                <div className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="mb-4 font-semibold">Incluye</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Certificación vigente",
                    "Etiqueta informativa",
                    "Garantía de fábrica",
                    "Soporte técnico",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sticky booking widget */}
          <div className="w-full lg:w-[420px]">
            <div className="sticky top-28 space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-2xl shadow-primary/5">
              {/* Header */}
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
                  {product.category}
                </div>
                <h1 className="text-xl font-bold leading-snug text-card-foreground">
                  {product.name}
                </h1>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">
                    ${finalPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">MXN</span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.priceOriginalMxn.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Service type */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo de servicio
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={serviceType === "delivery" ? "default" : "outline"}
                    className={cn(
                      "w-full justify-start gap-2 text-xs",
                      serviceType !== "delivery" && "border-border/50 bg-transparent hover:bg-secondary"
                    )}
                    onClick={() => setServiceType("delivery")}
                  >
                    <Truck className="h-4 w-4" />
                    Entrega
                  </Button>
                  <Button
                    variant={serviceType === "maintenance" ? "default" : "outline"}
                    className={cn(
                      "w-full justify-start gap-2 text-xs",
                      serviceType !== "maintenance" && "border-border/50 bg-transparent hover:bg-secondary"
                    )}
                    onClick={() => setServiceType("maintenance")}
                  >
                    <Wrench className="h-4 w-4" />
                    Mantenimiento
                  </Button>
                </div>
              </div>

              {/* Date picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha programada
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start border-border/50 bg-transparent text-left font-normal hover:bg-secondary",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cantidad
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/50 bg-transparent hover:bg-secondary"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/50 bg-transparent hover:bg-secondary"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-extrabold">
                  ${(finalPrice * quantity).toFixed(2)} MXN
                </span>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full gap-2 text-base font-semibold"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Agregar al carrito
              </Button>

              {product.purchaseUrl && (
                <a
                  href={product.purchaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 border-primary/30 bg-transparent text-base font-semibold text-primary hover:bg-primary/10"
                  >
                    Comprar ahora
                  </Button>
                </a>
              )}

              {/* Trust badge */}
              <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0 text-primary" />
                Producto certificado. Entrega segura en toda la república.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
