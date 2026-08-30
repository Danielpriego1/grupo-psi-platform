import { useRef } from "react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { ContinuidadOperativaSection } from "@/components/ContinuidadOperativaSection";
import { AboutSection } from "@/components/AboutSection";
import { CTASection } from "@/components/CTASection";
import { CustomerStories } from "@/components/CustomerStories";
import { CoverageMap } from "@/components/CoverageMap";
import { BrandsTicker } from "@/components/BrandsTicker";
import { ServicesSection } from "@/components/ServicesSection";
import { SEO } from "@/components/SEO";
import { categories } from "@/data/categories";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import catFuego from "@/assets/cat-fuego.jpg";
import catUniformes from "@/assets/cat-uniformes.jpg";

// Vallen-style hero images per category
const CATEGORY_IMAGES: Record<string, string> = {
  "equipos-contra-fuego": catFuego,
  epp:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
  uniformes: catUniformes,
  "senalizacion-industrial":
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80",
  "primeros-auxilios":
    "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80";

const Index = () => {
  const catalogRef = useRef<HTMLDivElement>(null);

  const scrollToProducts = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Grupo PSI | Equipamiento y Mantenimiento Industrial Certificado"
        description="Catálogo de extintores NOM-154, EPP, uniformes industriales, señalización y servicios de mantenimiento para empresas en México."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Grupo PSI",
          url: "https://psi-spark-grid.lovable.app/",
          inLanguage: "es-MX",
        }}
      />
      <HeroSection onScrollToProducts={scrollToProducts} />


      {/* Vallen-style Category cards section */}
      <main ref={catalogRef} className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide uppercase">
            Catálogo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Nuestro <span className="text-primary">Equipamiento</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Encuentra todo el equipamiento que tu empresa necesita
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {categories.map((cat, i) => {
            const img = CATEGORY_IMAGES[cat.slug] ?? FALLBACK_IMAGE;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/categoria/${cat.slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl h-72 shadow-md transition-shadow duration-500 group-hover:shadow-[0_20px_60px_-12px_hsl(var(--primary)/0.35)] bg-black">
                    {/* Background image wrapper — scale on inner element to avoid layer repaint flash */}
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                      <img
                        src={img}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>
                    {/* Dark gradient overlay — static */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 pointer-events-none" />
                    {/* Orange accent bar on hover */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <span className="inline-block mb-2 self-start px-2.5 py-0.5 rounded-full bg-primary/90 text-white text-xs font-semibold uppercase tracking-wide">
                        {cat.subcategories.length} líneas
                      </span>
                      <h3 className="text-xl font-bold text-white mb-1 drop-shadow">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-white/70 leading-snug mb-3 line-clamp-2">
                        {cat.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-3 transition-all duration-200">
                        Ver productos <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>

      <BrandsTicker />
      <ServicesSection />
      <AboutSection />
      <CustomerStories />
      <CoverageMap />
      <CTASection />
    </div>
  );
};

export default Index;
