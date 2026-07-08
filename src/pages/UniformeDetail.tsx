import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, FileText, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { SEO } from "@/components/SEO";
import { ProductImageLightbox } from "@/components/ProductImageLightbox";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
  images: string[];
  sizes: string[];
  finalPrice: number;
  basePrice: number;
  specPdfUrl?: string | null;
  inventoryStock?: number | null;
  categorySlug: string;
}

/**
 * Yazbek-style product page (light e-commerce layout) used specifically for
 * Uniformes category. Big product image + thumbnail rail on the left; SKU,
 * price, size chips, color-neutral variant chips and quantity selector on
 * the right. No calendar / map — uniformes ship with normal fulfillment.
 */
export default function UniformeDetail({
  product,
  images,
  sizes,
  finalPrice,
  basePrice,
  specPdfUrl,
  inventoryStock,
  categorySlug,
}: Props) {
  const { addItem } = useCart();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Selecciona una talla");
      return;
    }
    addItem({
      product,
      quantity,
      selectedSize: selectedSize || undefined,
      serviceType: "delivery",
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const nextImg = () => setCurrentImage((p) => (p + 1) % images.length);
  const prevImg = () => setCurrentImage((p) => (p - 1 + images.length) % images.length);

  const seoDescription = (product.description || product.name).slice(0, 158);
  const seoImage = images[0]?.startsWith("http") ? images[0] : undefined;

  return (
    <div className="min-h-screen bg-white text-slate-900 pt-20 pb-20">
      <SEO
        title={`${product.name} | Grupo PSI`}
        description={seoDescription}
        path={`/product/${product.id}`}
        type="product"
        image={seoImage}
      />

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span>›</span>
          <Link to={`/categoria/${categorySlug}`} className="hover:text-primary">Uniformes</Link>
          <span>›</span>
          <span className="truncate text-slate-700">{product.name}</span>
        </nav>

        <Link
          to={`/categoria/${categorySlug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Uniformes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[80px_1fr_420px] gap-6 items-start">
          {/* ─── Thumbnail rail (desktop) ─── */}
          {images.length > 1 && (
            <div className="hidden lg:flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    "h-20 w-20 shrink-0 rounded-md overflow-hidden border-2 bg-white transition-all duration-200",
                    i === currentImage
                      ? "border-primary shadow-md"
                      : "border-slate-200 hover:border-slate-400"
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}

          {/* ─── Main image ─── */}
          <div className="space-y-4 lg:col-start-2">
            <div
              className="group relative aspect-square overflow-hidden rounded-lg bg-slate-50 border border-slate-200 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={images[currentImage]}
                alt={product.name}
                className="h-full w-full object-contain p-6 sm:p-10 transition-transform duration-500 group-hover:scale-105"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImg(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center hover:bg-white shadow-sm"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImg(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center hover:bg-white shadow-sm"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-700" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile thumbnails */}
            {images.length > 1 && (
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 snap-x">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      "h-16 w-16 shrink-0 rounded-md overflow-hidden border-2 bg-white snap-start",
                      i === currentImage ? "border-primary" : "border-slate-200"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}

            <ProductImageLightbox
              images={images}
              index={currentImage}
              open={lightboxOpen}
              alt={product.name}
              onClose={() => setLightboxOpen(false)}
              onIndexChange={setCurrentImage}
            />
          </div>

          {/* ─── Info panel ─── */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">
                SKU {product.id}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-slate-900">
                {product.name}
              </h1>
              {basePrice > 0 && (
                <div className="pt-2">
                  <div className="text-3xl font-bold text-slate-900">
                    ${finalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-2 text-sm font-medium text-slate-500">MXN</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Impuestos incluidos.</p>
                </div>
              )}
              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  En existencia{inventoryStock != null ? ` · ${inventoryStock} disponibles` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Agotado
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Cantidad</div>
              <div className="inline-flex items-center rounded-md border border-slate-300 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-11 w-11 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-14 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-11 w-11 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Talla</div>
                  <button className="text-xs font-medium text-primary hover:underline">Guía de tallas</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-[52px] h-11 rounded-md border px-3 text-sm font-semibold transition-all",
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-3 pt-2">
              <Button
                size="storeCta"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agregar al carrito
              </Button>
              <Button
                size="storeCta"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                Comprar ahora
              </Button>
            </div>

            {/* Trust badges */}
            <ul className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200">
              <li className="flex flex-col items-center gap-1 text-center text-[10px] font-medium text-slate-600">
                <Truck className="h-5 w-5 text-primary" />
                Envío nacional
              </li>
              <li className="flex flex-col items-center gap-1 text-center text-[10px] font-medium text-slate-600">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Compra segura
              </li>
              <li className="flex flex-col items-center gap-1 text-center text-[10px] font-medium text-slate-600">
                <RotateCcw className="h-5 w-5 text-primary" />
                Cambios y devoluciones
              </li>
            </ul>

            {/* Description */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Detalles del producto</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Spec PDF */}
            {specPdfUrl && (
              <a
                href={specPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Descargar ficha técnica
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
