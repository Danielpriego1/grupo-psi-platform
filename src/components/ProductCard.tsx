import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { ArrowRight } from "lucide-react";
import { useInventoryImages } from "@/hooks/useInventoryImages";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const inventoryImages = useInventoryImages();
  const displayImage = inventoryImages[product.id] || product.image;
  const [imageBroken, setImageBroken] = useState(false);

  // Hide the card entirely if there is no valid image source or it failed to load,
  // or if the product has no real price. Public catalog must never show empty cards.
  if (!displayImage || imageBroken || !product.priceOriginalMxn || Number(product.priceOriginalMxn) <= 0) {
    return null;
  }

  return (
    <Link to={`/product/${product.id}`} className="block w-full h-full">
      <div
        className="group relative h-full rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:border-primary/40 hover:bg-card/95 hover:shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.45)] before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-primary before:scale-x-0 before:transition-transform before:duration-300 before:z-20 group-hover:before:scale-x-100 animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="relative z-10 p-5">
          {/* Product image */}
          <div className="aspect-[4/3] mb-5 overflow-hidden rounded-xl bg-background/40">
            <img
              src={displayImage}
              alt={product.name}
              loading="lazy"
              onError={() => setImageBroken(true)}
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
                ${Number(product.priceOriginalMxn).toFixed(2)} MXN
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
