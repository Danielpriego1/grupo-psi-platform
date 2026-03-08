import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { ArrowRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`} className="block w-full">
      {/* Outer wrapper for glow border effect */}
      <div
        className="group relative rounded-2xl p-[2px] transition-all duration-500 hover:-translate-y-1 animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Gradient glow border — only visible on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(270,80%,65%)] via-[hsl(210,90%,60%)] to-[hsl(180,80%,55%)] opacity-0 blur-[2px] transition-opacity duration-500 group-hover:opacity-80" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(270,80%,65%)] via-[hsl(210,90%,60%)] to-[hsl(180,80%,55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Card content */}
        <div className="relative z-10 overflow-hidden rounded-2xl bg-card p-5 transition-shadow duration-500 group-hover:shadow-[0_8px_40px_-8px_hsl(210,90%,60%,0.2)]">
          {/* Product image */}
          <div className="aspect-[4/3] mb-5 overflow-hidden rounded-xl bg-muted/50">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
                ${product.priceOriginalMxn.toFixed(2)} MXN
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
