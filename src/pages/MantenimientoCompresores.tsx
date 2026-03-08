import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wind, Shield, CheckCircle, Phone, Mail, User, ChevronLeft, ChevronRight, Wrench, Gauge, Timer, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COMPRESSOR_IMAGES = [
  { src: "/images/services/compresores-linea.jpeg", alt: "Línea de compresores de aire respirable" },
  { src: "/images/services/compresor-desarme-1.jpg", alt: "Desarme de compresor – cabezal" },
  { src: "/images/services/compresor-desarme-2.jpg", alt: "Compresor con filtro secador" },
  { src: "/images/services/compresor-filtro.jpg", alt: "Mantenimiento de filtro catalizador Bauer" },
  { src: "/images/services/compresor-vista-lateral.jpg", alt: "Vista lateral del compresor" },
  { src: "/images/services/compresor-cilindro.jpg", alt: "Interior de cilindro – inspección de baleros" },
  { src: "/images/services/compresor-ensamble.jpg", alt: "Ensamble de pistón y anillos" },
  { src: "/images/services/etiqueta-scba.jpeg", alt: "Etiqueta de servicio SCBA – Grupo PSI" },
];

const CASCADE_IMAGES = [
  { src: "/images/services/maniobra-grua-cilindros.jpg", alt: "Maniobra con grúa – traslado de sistema de cascada" },
  { src: "/images/services/compresor-campo-psi.jpg", alt: "Compresor portátil PSI en campo" },
  { src: "/images/services/cilindros-operador.jpeg", alt: "Operador revisando sistema de cascada" },
  { src: "/images/services/cilindros-detalle.jpeg", alt: "Detalle de válvulas y conexiones en cascada" },
  { src: "/images/services/cilindros-rack-1.jpeg", alt: "Sistema de cascada – rack de cilindros" },
  { src: "/images/services/cilindros-rack-2.jpeg", alt: "Sistema de cascada – vista frontal" },
];

const SERVICES = [
  {
    icon: Wrench,
    title: "Mantenimiento Preventivo",
    description: "Cambio de filtros, aceite, empaques y revisión de válvulas de seguridad según horas de operación.",
  },
  {
    icon: Gauge,
    title: "Prueba de Calidad de Aire",
    description: "Análisis certificado de oxígeno, CO, CO₂, vapor de aceite y agua conforme a la norma Grado D.",
  },
  {
    icon: Timer,
    title: "Mantenimiento Correctivo",
    description: "Reparación de cabezales, cambio de bielas, pistones, anillos y baleros de cigüeñal.",
  },
  {
    icon: Award,
    title: "Certificación SCBA",
    description: "Etiqueta de servicio con fecha de mantenimiento, capacidad PSI/bar y próxima fecha de servicio.",
  },
];

const MantenimientoCompresores = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [currentCascadeImage, setCurrentCascadeImage] = useState(0);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", notes: "" });

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % COMPRESSOR_IMAGES.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + COMPRESSOR_IMAGES.length) % COMPRESSOR_IMAGES.length);
  const nextCascade = () => setCurrentCascadeImage((prev) => (prev + 1) % CASCADE_IMAGES.length);
  const prevCascade = () => setCurrentCascadeImage((prev) => (prev - 1 + CASCADE_IMAGES.length) % CASCADE_IMAGES.length);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name || !contact.phone || !contact.email) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    toast.success("¡Solicitud enviada! Nos pondremos en contacto contigo pronto.");
    setContact({ name: "", phone: "", email: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-foreground text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium">
                <Wind className="h-4 w-4" />
                Aire Respirable Grado D
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl leading-tight">
                Mantenimiento de Compresores para Aire Respirable
              </h1>
              <p className="text-primary-foreground/80 text-lg max-w-lg">
                Servicio especializado de mantenimiento preventivo y correctivo para compresores de alta y baja presión que suministran aire respirable <strong>Grado D</strong> a equipos SCBA.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#contacto">
                  <Button size="lg" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold">
                    Solicitar Servicio
                  </Button>
                </a>
                <a href="#servicios">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Ver Servicios
                  </Button>
                </a>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-background/5">
              <img
                src={COMPRESSOR_IMAGES[currentImage].src}
                alt={COMPRESSOR_IMAGES[currentImage].alt}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <p className="text-sm text-white/90 font-medium drop-shadow-lg">
                  {COMPRESSOR_IMAGES[currentImage].alt}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={prevImage}
                    className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Dots */}
              <div className="absolute bottom-14 left-4 flex gap-1.5">
                {COMPRESSOR_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentImage ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="servicios" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-3">
            Nuestros Servicios
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mantenimiento integral para compresores de aire respirable, cumpliendo con las normativas de seguridad industrial.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{service.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specs / What we do */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-6">
                ¿Qué es el Aire Respirable Grado D?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  El <strong className="text-foreground">Grado D</strong> es el estándar mínimo de calidad de aire para equipos de respiración autónomos (SCBA), definido por la <em>Compressed Gas Association</em> (CGA G-7.1).
                </p>
                <ul className="space-y-3">
                  {[
                    "Oxígeno: 19.5% – 23.5%",
                    "Monóxido de carbono (CO): máx. 10 ppm",
                    "Dióxido de carbono (CO₂): máx. 1,000 ppm",
                    "Vapor de aceite: máx. 5 mg/m³",
                    "Sin olor ni sabor objetable",
                  ].map((spec) => (
                    <li key={spec} className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{spec}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Nuestro servicio garantiza que tu compresor entregue aire que cumple con estos parámetros, protegiendo la vida de los operadores.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COMPRESSOR_IMAGES.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl overflow-hidden",
                    i === 0 && "col-span-2 aspect-video",
                    i > 0 && "aspect-square"
                  )}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cascade Systems Section */}
      <section id="cascada" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Sistemas de Cascada
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Mantenimiento de Sistemas de Cascada
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Los sistemas de cascada almacenan aire respirable Grado D en bancos de cilindros de alta presión, los cuales son llenados por compresores dedicados. Ofrecemos mantenimiento integral tanto del compresor de llenado como de los cilindros, manifold y válvulas del sistema.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              {[
                "Inspección visual y prueba hidrostática de cilindros",
                "Revisión y reemplazo de válvulas de alta presión",
                "Verificación de mangueras y conexiones del manifold",
                "Prueba de fugas en todo el sistema",
                "Recarga de cilindros con aire respirable certificado",
                "Logística y maniobras para traslado de equipos",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cascade Gallery */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
            <img
              src={CASCADE_IMAGES[currentCascadeImage].src}
              alt={CASCADE_IMAGES[currentCascadeImage].alt}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <p className="text-sm text-white/90 font-medium drop-shadow-lg">
                {CASCADE_IMAGES[currentCascadeImage].alt}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={prevCascade}
                  className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextCascade}
                  className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="absolute bottom-14 left-4 flex gap-1.5">
              {CASCADE_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentCascadeImage(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentCascadeImage ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-3">
            Marcas que Atendemos
          </h2>
          <p className="text-muted-foreground">Experiencia con las principales marcas de compresores industriales</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Bauer", "Mako", "Coltri", "Nuvair", "Alkin", "Jordan"].map((brand) => (
            <div
              key={brand}
              className="rounded-xl border border-border bg-card px-8 py-4 text-center font-bold text-lg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300"
            >
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section id="contacto" className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-2">
                Solicitar Servicio
              </h2>
              <p className="text-muted-foreground">
                Déjanos tus datos y nos comunicaremos contigo para programar el servicio.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <div className="space-y-2">
                <Label htmlFor="c-name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo *
                </Label>
                <Input
                  id="c-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono *
                  </Label>
                  <Input
                    id="c-phone"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="993 155 0935"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico *
                  </Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-notes" className="text-sm font-medium">
                  Detalles del equipo (marca, modelo, horas de uso, etc.)
                </Label>
                <Textarea
                  id="c-notes"
                  value={contact.notes}
                  onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                  placeholder="Ej: Compresor Bauer Capitano, 500 horas, requiere cambio de filtros y prueba de calidad de aire..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Enviar Solicitud
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MantenimientoCompresores;
