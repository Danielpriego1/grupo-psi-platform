import { useRef } from "react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { CTASection } from "@/components/CTASection";
import { CustomerStories } from "@/components/CustomerStories";
import { categories } from "@/data/categories";
import { motion } from "framer-motion";

const Index = () => {
  const catalogRef = useRef<HTMLDivElement>(null);

  const scrollToProducts = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onScrollToProducts={scrollToProducts} />

      {/* Category cards section */}
      <main ref={catalogRef} className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Nuestro <span className="text-primary">Catálogo</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Encuentra todo el equipamiento que tu empresa necesita
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/categoria/${cat.slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_40px_-8px_hsl(15,90%,55%,0.15)] hover:-translate-y-1">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground mb-2">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <AboutSection />
      <CustomerStories />
      <CTASection />
    </div>
  );
};

export default Index;
