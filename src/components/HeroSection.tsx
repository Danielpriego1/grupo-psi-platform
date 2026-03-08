import { ArrowRight, Shield, Flame, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            backgroundImage: `
              linear-gradient(135deg, 
                hsl(220 20% 7%) 0%, 
                hsl(220 25% 12%) 25%, 
                hsl(199 40% 15%) 50%, 
                hsl(262 30% 15%) 75%, 
                hsl(220 20% 7%) 100%
              )`,
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(199 89% 48% / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(199 89% 48% / 0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/20 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Shield className="h-3.5 w-3.5" />
            Equipamiento y Seguridad Industrial Certificada
          </div>

          <h1
            className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl"
            style={{ opacity: 0, animation: "slide-up 0.6s ease-out 0.1s forwards" }}
          >
            Protege a tu equipo con{" "}
            <span className="gradient-text">soluciones industriales</span>{" "}
            de confianza
          </h1>

          <p
            className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground"
            style={{ opacity: 0, animation: "slide-up 0.6s ease-out 0.3s forwards" }}
          >
            Extintores certificados, uniformes de trabajo y servicios de mantenimiento con entrega programada en toda la república.
          </p>

          <div
            className="flex flex-wrap gap-4"
            style={{ opacity: 0, animation: "slide-up 0.6s ease-out 0.5s forwards" }}
          >
            <Button size="lg" className="gap-2 text-base font-semibold">
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-border/50 bg-transparent text-base hover:bg-secondary">
              Agendar servicio
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div
          className="mt-16 flex flex-wrap gap-4"
          style={{ opacity: 0, animation: "slide-up 0.6s ease-out 0.7s forwards" }}
        >
          {[
            { icon: Flame, label: "Extintores", count: "3 productos" },
            { icon: Shirt, label: "Uniformes", count: "2 productos" },
            { icon: Shield, label: "Seguridad", count: "Próximamente" },
          ].map((cat) => (
            <div
              key={cat.label}
              className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-5 py-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card/80 hover:glow-border cursor-pointer"
            >
              <cat.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
              <div>
                <div className="text-sm font-semibold">{cat.label}</div>
                <div className="text-xs text-muted-foreground">{cat.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
