import { useParams, Link } from "react-router-dom";
import { getProductById, getProductPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ShoppingCart, Truck, Wrench, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LocationMap } from "@/components/LocationMap";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const product = getProductById(id || "");
  const { addItem } = useCart();
  const [date, setDate] = useState<Date>();
  const [serviceType, setServiceType] = useState<"delivery" | "maintenance">("delivery");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <Link to="/" className="text-primary hover:underline">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : [product.image || "/placeholder.svg"];
  const allSizes = product.sizes ? Object.values(product.sizes).flat() : [];

  const basePrice = getProductPrice(product, selectedSize || undefined);
  const finalPrice = product.discount
    ? basePrice * (1 - product.discount)
    : basePrice;

  const handleAddToCart = () => {
    if (allSizes.length > 0 && !selectedSize) {
      toast.error("Selecciona una talla");
      return;
    }
    addItem({
      product,
      quantity,
      selectedSize: selectedSize || undefined,
      serviceType,
      date: date?.toISOString(),
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const nextImg = () => setCurrentImage((prev) => (prev + 1) % allImages.length);
  const prevImg = () => setCurrentImage((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ─── LEFT: Images, Description, Map ─── */}
          <div className="flex-1 space-y-8">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted/30">
              <img
                src={allImages[currentImage]}
                alt={product.name}
                className="h-full w-full object-contain p-8 transition-opacity duration-300"
              />
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      "h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200",
                      i === currentImage ? "border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Descripción</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{product.description}</p>
              {product.variants && (
                <div className="flex flex-wrap gap-2">
                  {Object.values(product.variants).flat().map((v) => (
                    <span key={v} className="rounded-lg border border-border bg-muted/50 px-3 py-1 text-xs font-medium">{v}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {serviceType === "delivery" ? "Ubicación de entrega" : "Ubicación de recolección"}
              </h2>
              <LocationMap onLocationSelect={(lat, lng) => setLocation({ lat, lng })} />
            </div>
          </div>

          {/* ─── RIGHT: Sticky booking widget ─── */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-20 space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">{product.category}</div>
                <h1 className="text-xl font-bold text-card-foreground leading-tight">{product.name}</h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">${finalPrice.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">MXN</span>
                  {product.discount && (
                    <span className="text-sm text-muted-foreground line-through">${product.priceOriginalMxn.toFixed(2)}</span>
                  )}
                </div>
                {!product.inStock && (
                  <span className="inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">Agotado</span>
                )}
              </div>

              {/* Size selector */}
              {allSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Talla</div>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          selectedSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/50 hover:border-primary/40"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-3">
                <div className="text-sm font-semibold">Cantidad</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Service type toggle */}
              <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
                <div className="text-sm font-semibold">Tipo de servicio</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={serviceType === "delivery" ? "default" : "outline"} className="w-full text-xs" onClick={() => setServiceType("delivery")}>
                    <Truck className="mr-2 h-4 w-4" /> Entrega
                  </Button>
                  <Button variant={serviceType === "maintenance" ? "default" : "outline"} className="w-full text-xs" onClick={() => setServiceType("maintenance")}>
                    <Wrench className="mr-2 h-4 w-4" /> Mantenimiento
                  </Button>
                </div>
              </div>

              {/* Calendar */}
              <div className="space-y-3">
                <div className="text-sm font-semibold">{serviceType === "delivery" ? "Fecha de entrega" : "Fecha de recolección"}</div>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    className={cn("p-3 pointer-events-auto w-full")}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
                {date && (
                  <p className="text-sm text-primary font-medium">📅 {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
                )}
              </div>

              {/* Add to cart */}
              <Button size="lg" className="w-full text-base" onClick={handleAddToCart} disabled={!product.inStock}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agregar al carrito — ${(finalPrice * quantity).toFixed(2)}
              </Button>

              {product.purchaseUrl && (
                <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" size="lg" className="w-full text-base">Comprar ahora</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
