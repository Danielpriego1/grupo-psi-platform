import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { ArrowRight, Tag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount && product.discount > 0;
  const discountedPrice = hasDiscount
    ? product.priceOriginalMxn * (1 - product.discount!)
    : product.priceOriginalMxn;

  return (
    <Link to={`/product/${product.id}`} className="block w-full">
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.25)]">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground">
            <Tag className="h-3 w-3" />
            -{(product.discount! * 100).toFixed(0)}%
          </div>
        )}

        <div className="aspect-square overflow-hidden bg-secondary/30 p-6">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="p-5 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {product.category}
          </div>
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-card-foreground">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-foreground">
              ${discountedPrice.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">MXN</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.priceOriginalMxn.toFixed(2)}
              </span>
            )}
          </div>

          {/* Hover action */}
          <div className="flex items-center pt-2 text-xs font-medium text-primary opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            Ver detalles
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
