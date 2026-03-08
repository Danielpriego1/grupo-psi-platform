import { products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <main className="container mx-auto px-4 pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Nuestro Catálogo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explora nuestros productos certificados de seguridad industrial
            </p>
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            {products.length} productos
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              style={{
                opacity: 0,
                animation: `slide-up 0.5s ease-out ${0.1 + i * 0.08}s forwards`,
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-secondary/30 py-12">
        <div className="container mx-auto px-4 text-center">
          <img
            src="/logo_y_leyenda.png"
            alt="Grupo PSI"
            className="mx-auto mb-4 h-16 w-auto opacity-70"
          />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Grupo PSI. Equipamiento y Seguridad Industrial. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
