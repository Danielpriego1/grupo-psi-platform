import { useState, useRef } from "react";
import { visibleProducts, getCategories } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { CTASection } from "@/components/CTASection";
import { CustomerStories } from "@/components/CustomerStories";
import { motion } from "framer-motion";

const Index = () => {
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  const filtered = activeCategory
    ? visibleProducts.filter((p) => p.category === activeCategory)
    : visibleProducts;

  const scrollToProducts = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onScrollToProducts={scrollToProducts} />

      {/* Catalog section */}
      <main ref={catalogRef} className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Nuestro <span className="text-primary">Catálogo</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Encuentra todo el equipamiento que tu empresa necesita
          </p>
        </motion.div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
              !activeCategory
                ? "border-primary bg-primary text-primary-foreground glow-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            Todos ({visibleProducts.length})
          </button>
          {categories.map((cat) => {
            const count = visibleProducts.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground glow-primary"
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
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
            >
              <ProductCard product={product} index={i} />
            </motion.div>
          ))}
        </div>
      </main>

      <AboutSection />
      <CTASection />
    </div>
  );
};

export default Index;
