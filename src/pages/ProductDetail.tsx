import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById, getProductPrice } from "@/data/products";
import { mapStaticCategory, mapInventorySubcategory } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, FileText, MessageCircle, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LocationMap } from "@/components/LocationMap";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useInventoryImages } from "@/hooks/useInventoryImages";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { ProductImageLightbox } from "@/components/ProductImageLightbox";

const ProductDetail = () => {
  const { id } = useParams();
  const staticProduct = getProductById(id || "");
  const { addItem } = useCart();
  const inventoryImages = useInventoryImages();
  const [date, setDate] = useState<Date>();
  const serviceType: "delivery" = "delivery";
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("inventory")
          .select("*")
          .eq("product_id", id)
          .maybeSingle();
        if (data) setInventoryItem(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const invImages: string[] = Array.isArray((inventoryItem as any)?.image_urls) ? (inventoryItem as any).image_urls.filter(Boolean) : [];
  const primaryInvImg = invImages[0] || (inventoryItem as any)?.image_url || undefined;
  const product: import("@/data/products").Product | null = staticProduct || (inventoryItem ? {
    id: inventoryItem.product_id,
    name: inventoryItem.product_name,
    category: (inventoryItem as any).subcategory || inventoryItem.category || "EPP",
    description: inventoryItem.description || inventoryItem.product_name,
    priceOriginalMxn: Number(inventoryItem.unit_price),
    discount: null,
    purchaseUrl: null,
    purchaseStatus: "Available",
    inStock: inventoryItem.stock > 0,
    image: primaryInvImg,
    images: invImages.length > 1 ? invImages : undefined,
  } : null);

  // Earliest delivery date: today + 2 business days (skip weekends).
  // Must run before any early return to keep hook order stable.
  const minDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    let added = 0;
    while (added < 2) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] pt-16">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_20px_rgba(255,100,0,0.3)]"></div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-primary animate-pulse">Cargando Producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] pt-16">
        <div className="text-center space-y-6 bg-white/5 p-12 rounded-[3rem] border border-white/10">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Producto no encontrado</h1>
          <p className="text-muted-foreground font-medium">Lo sentimos, el producto que buscas no está disponible.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white hover:bg-primary/90 transition-all uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const invImage = inventoryImages[product.id] || primaryInvImg;
  const baseImages = product.images?.length ? product.images : [product.image || "/placeholder.svg"];
  const allImages = Array.from(new Set([...(invImage ? [invImage] : []), ...baseImages])).filter(Boolean) as string[];
  const allSizes = product.sizes ? Object.values(product.sizes).flat() : [];

  const basePrice = getProductPrice(product, selectedSize || undefined);
  const finalPrice = product.discount ? basePrice * (1 - product.discount) : basePrice;

  const specPdfUrl = (inventoryItem as any)?.spec_pdf_url;

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

  // Determine category slug for back navigation
  const categorySlug = (() => {
    if (inventoryItem) {
      const mapped = mapInventorySubcategory(inventoryItem.category, inventoryItem.subcategory);
      return mapped.mainCategory;
    }
    const mapped = mapStaticCategory(product.category);
    return mapped.mainCategory;
  })();

  const seoDescription = (product.description || product.name).slice(0, 158);
  const seoImage = allImages[0]?.startsWith("http") ? allImages[0] : undefined;

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20">
      <SEO
        title={`${product.name} | Grupo PSI`}
        description={seoDescription}
        path={`/product/${product.id}`}
        type="product"
        image={seoImage}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || product.name,
          image: allImages.filter((i) => i && !i.includes("placeholder")),
          brand: { "@type": "Brand", name: "Grupo PSI" },
          offers: {
            "@type": "Offer",
            priceCurrency: "MXN",
            price: finalPrice.toFixed(2),
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `https://psi-spark-grid.lovable.app/product/${product.id}`,
          },
        }}
      />
      <div className="container mx-auto px-4 max-w-7xl">
        <Link 
          to={`/categoria/${categorySlug}`} 
          className="group mb-10 inline-flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-primary transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 group-hover:border-primary/50 group-hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4" />
          </div>
          VOLVER AL CATÁLOGO
        </Link>

        <div className="flex flex-col gap-12 lg:flex-row items-start">
          {/* ─── LEFT: Images, Description, Spec PDF, Map ─── */}
          <div className="flex-1 space-y-12 w-full">
            <div className="space-y-4">
              <div
                className="group relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-2xl bg-white cursor-zoom-in"
                onMouseEnter={() => setImageZoomed(true)}
                onMouseLeave={() => setImageZoomed(false)}
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={allImages[currentImage]}
                  alt={product.name}
                  className={cn(
                    "h-full w-full object-contain p-4 sm:p-8 transition-transform duration-300 ease-out",
                    imageZoomed && "scale-150"
                  )}
                />
                {allImages.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); prevImg(); }} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextImg(); }} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 backdrop-blur-sm border border-border px-3 py-1 text-xs font-bold text-foreground">
                      {currentImage + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={cn(
                        "h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl overflow-hidden border-2 bg-white transition-all duration-200",
                        i === currentImage ? "border-primary shadow-lg shadow-primary/30" : "border-border hover:border-primary/40"
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-5xl bg-background/95 p-2">
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
                <img src={allImages[currentImage]} alt={product.name} className="max-h-[85vh] w-full object-contain bg-white" />
              </DialogContent>
            </Dialog>


            <div className="space-y-6 bg-white/5 rounded-3xl p-8 border border-white/5">
              <h2 className="text-2xl font-black tracking-tight uppercase text-primary">Descripción del Producto</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-gray-300 text-lg font-medium">{product.description}</p>
              {product.variants && (
                <div className="flex flex-wrap gap-2">
                  {Object.values(product.variants).flat().map((v) => (
                    <span key={v} className="rounded-lg border border-border bg-muted/50 px-3 py-1 text-xs font-medium">{v}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Spec PDF */}
            {specPdfUrl && (
              <div className="space-y-6 bg-primary/5 rounded-3xl p-8 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">Documentación Técnica</h2>
                    <p className="text-sm text-primary/70 font-bold">Especificaciones oficiales del fabricante</p>
                  </div>
                </div>
                <a
                  href={specPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
                >
                  Descargar PDF
                </a>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {serviceType === "delivery" ? "Ubicación de entrega" : "Ubicación de recolección"}
              </h2>
              <LocationMap onLocationSelect={(lat, lng) => setLocation({ lat, lng })} scrollWheelZoom={false} />
            </div>
          </div>

          {/* ─── RIGHT: Sticky booking widget ─── */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-24 space-y-8 rounded-[2rem] border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_80px_-20px_rgba(255,100,0,0.1)]">
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {product.category}
                </div>
                <h1 className="text-3xl font-black text-card-foreground leading-[1.1] tracking-tight">
                  {product.name}
                </h1>
                {basePrice > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1">Precio Total</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-primary tracking-tighter">
                          ${finalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground">MXN</span>
                      </div>
                      {product.discount && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground line-through decoration-primary/50">
                            ${product.priceOriginalMxn.toFixed(2)}
                          </span>
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white uppercase">
                            -{(product.discount * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xl font-bold text-muted-foreground">Consultar precio</div>
                    <a
                      href={`https://wa.me/5219931684717?text=${encodeURIComponent(`Hola, me interesa cotizar: ${product.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Cotizar por WhatsApp
                    </a>
                  </div>
                )}
                {!product.inStock && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    Agotado
                  </span>
                )}
                {inventoryItem && product.inStock && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Stock: {inventoryItem.stock} unidades
                  </span>
                )}
                {inventoryItem && !product.inStock && !inventoryItem.stock && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    Sin stock
                  </span>
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

              {/* Calendar */}
              <div className="space-y-3">
                <div className="text-sm font-semibold">Fecha de entrega</div>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    className={cn("p-3 pointer-events-auto w-full")}
                    modifiers={{ weekend: (d) => d.getDay() === 0 || d.getDay() === 6 }}
                    modifiersClassNames={{ weekend: "text-muted-foreground/40 line-through" }}
                    disabled={(d) => {
                      const day = new Date(d); day.setHours(0,0,0,0);
                      if (day.getDay() === 0 || day.getDay() === 6) return true;
                      return day < minDeliveryDate;
                    }}
                  />
                </div>
                {date && (
                  <p className="text-sm text-primary font-medium">📅 {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  La fecha de entrega está sujeta a confirmación de pago. Los pedidos confirmados antes de las 12:00 pm en días hábiles se preparan el mismo día.
                </p>
              </div>

              {/* Add to cart */}
              <Button 
                size="lg" 
                className="w-full py-8 text-lg font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                onClick={handleAddToCart} 
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-3 h-6 w-6" />
                {basePrice > 0 ? `Agregar al carrito — $${(finalPrice * quantity).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Agregar al carrito"}
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
