import { products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 md:py-24">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Equipamiento y Seguridad Industrial
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Protege a tu equipo con los mejores productos de seguridad, uniformes y extintores certificados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
