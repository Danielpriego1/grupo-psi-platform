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
      <div
        className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.3)] animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Glow effect background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:from-primary/10 group-hover:opacity-100" />

        <div className="aspect-square mb-6 overflow-hidden rounded-lg bg-muted/50 p-4">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.category}
          </div>
          <h3 className="line-clamp-2 min-h-[3rem] font-semibold text-card-foreground transition-colors duration-300 group-hover:text-primary">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
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

        {/* Action arrow with text reveal */}
        <div className="mt-6 flex items-center overflow-hidden text-sm font-medium text-primary">
          <div className="flex items-center transition-all duration-300 group-hover:translate-x-0 -translate-x-4">
            <ArrowRight className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:translate-x-1" />
            <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Ver detalles
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
