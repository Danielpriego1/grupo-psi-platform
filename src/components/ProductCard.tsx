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
        className="group relative h-full rounded-3xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer hover:-translate-y-3 hover:border-primary/30 hover:bg-card/80 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_30px_60px_-15px_rgba(255,100,0,0.15)] animate-slide-up"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Animated background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* Product image container */}
          <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-2xl bg-white/5 dark:bg-black/20 border border-border/20">
            <img
              src={displayImage}
              alt={product.name}
              loading="lazy"
              onError={() => setImageBroken(true)}
              className="h-full w-full object-contain p-4 transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-2"
            />
            {product.discount && (
              <div className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-[10px] font-black text-white shadow-lg shadow-primary/20 uppercase tracking-wider">
                -{(product.discount * 100).toFixed(0)}% OFF
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="flex-grow">
            <h3 className="line-clamp-3 min-h-[4.5rem] text-lg font-black text-card-foreground leading-tight group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </div>

          {/* Price and Action */}
          <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Precio</span>
              <span className="text-xl font-black text-primary">
                ${Number(product.priceOriginalMxn).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                <span className="text-[10px] ml-1 opacity-70">MXN</span>
              </span>
            </div>
            
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-primary/30">
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
