import { useState } from "react";
import { products, getCategories } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";

const Index = () => {
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero with logo */}
        <div className="mb-12 text-center">
          <img
            src="/images/logo_y_leyenda.png"
            alt="Grupo PSI"
            className="mx-auto mb-6 h-24 w-auto"
          />
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Equipamiento y Seguridad Industrial
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Protege a tu equipo con los mejores productos de seguridad, uniformes y extintores certificados.
          </p>
        </div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
              !activeCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
