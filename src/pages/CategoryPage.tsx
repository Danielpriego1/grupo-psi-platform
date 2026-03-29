import { useParams, Link } from "react-router-dom";
import { getCategoryBySlug, mapStaticCategory, mapInventorySubcategory } from "@/data/categories";
import { products as allStaticProducts } from "@/data/products";
import { useInventoryCatalog } from "@/hooks/useInventoryCatalog";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/products";

interface CatalogProduct extends Product {
  mainCategory: string;
  displaySubcategory: string;
}

const CategoryPage = () => {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug || "");
  const { inventoryProducts } = useInventoryCatalog();
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const categoryProducts = useMemo(() => {
    if (!category) return [];

    // Map static products
    const seenIds = new Set<string>();
    const result: CatalogProduct[] = [];

    for (const p of allStaticProducts) {
      const mapped = mapStaticCategory(p.category);
      if (mapped.mainCategory === category.slug) {
        seenIds.add(p.id);
        result.push({ ...p, mainCategory: mapped.mainCategory, displaySubcategory: mapped.subcategory });
      }
    }

    // Map inventory products
    for (const ip of inventoryProducts) {
      if (seenIds.has(ip.id)) continue;
      const mapped = mapInventorySubcategory(
        (ip as any).category || null,
        ip.subcategory || null
      );
      if (mapped.mainCategory === category.slug) {
        seenIds.add(ip.id);
        result.push({
          ...ip,
          mainCategory: mapped.mainCategory,
          displaySubcategory: mapped.subcategory,
        });
      }
    }

    return result;
  }, [category, inventoryProducts]);

  // Get actual subcategories that have products
  const activeSubcategories = useMemo(() => {
    const subs = [...new Set(categoryProducts.map((p) => p.displaySubcategory))].sort();
    return subs;
  }, [categoryProducts]);

  const filtered = activeSubcategory
    ? categoryProducts.filter((p) => p.displaySubcategory === activeSubcategory)
    : categoryProducts;

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Categoría no encontrada</h1>
          <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const Icon = category.icon;

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {category.name}
              </h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Subcategory filters */}
        {activeSubcategories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubcategory(null)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                !activeSubcategory
                  ? "border-primary bg-primary text-primary-foreground glow-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              Todos ({categoryProducts.length})
            </button>
            {activeSubcategories.map((sub) => {
              const count = categoryProducts.filter((p) => p.displaySubcategory === sub).length;
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                    activeSubcategory === sub
                      ? "border-primary bg-primary text-primary-foreground glow-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">Próximamente más productos en esta categoría</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
