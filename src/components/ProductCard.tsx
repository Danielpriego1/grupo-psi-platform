import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { ArrowRight } from "lucide-react";
import { useInventoryImages } from "@/hooks/useInventoryImages";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const inventoryImages = useInventoryImages();
  const displayImage = inventoryImages[product.id] || product.image || "/placeholder.svg";

  return (
    <Link to={`/product/${product.id}`} className="block w-full">
      <div
        className="group relative rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_48px_-12px_hsl(var(--primary)/0.2)] before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-primary before:scale-x-0 before:transition-transform before:duration-300 before:z-20 group-hover:before:scale-x-100 animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Card content */}
        <div className="relative z-10 p-5">
          {/* Product image */}
          <div className="aspect-[4/3] mb-5 overflow-hidden rounded-xl">
            <img
              src={displayImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>

          {/* Text content */}
          <div className="space-y-2">
            <h3 className="line-clamp-2 min-h-[3rem] text-base font-bold text-card-foreground transition-colors duration-300">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-lg font-bold text-primary">
                {product.sizePricing ? "Desde " : ""}${product.priceOriginalMxn.toFixed(2)} MXN
              </span>
              {product.discount && (
                <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">
                  -{(product.discount * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          {/* Arrow + label reveal on hover */}
          <div className="mt-5 flex items-center text-sm font-medium text-primary">
            <ArrowRight className="h-4 w-4 transition-transform duration-400 group-hover:translate-x-2" />
            <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-400 group-hover:ml-2 group-hover:max-w-[8rem] group-hover:opacity-100">
              Información
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
