import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { ArrowRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`} className="block w-full">
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]">
        {/* Glow effect background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:from-primary/10 group-hover:opacity-100" />
        
        <div className="aspect-square mb-6 overflow-hidden rounded-lg bg-muted/50 p-4">
          <img 
            src={product.image || "/placeholder.svg"} 
            alt={product.name}
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.category}
          </div>
          <h3 className="line-clamp-2 min-h-[3rem] font-semibold text-card-foreground">
            {product.name}
          </h3>
          <div className="text-lg font-bold text-primary">
            ${product.priceOriginalMxn.toFixed(2)} MXN
          </div>
        </div>

        {/* Action arrow with text reveal */}
        <div className="mt-6 flex items-center overflow-hidden text-sm font-medium text-primary">
          <div className="flex items-center transition-all duration-300 group-hover:translate-x-0 -translate-x-4">
            <ArrowRight className="h-4 w-4 mr-2" />
            <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Más información
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
