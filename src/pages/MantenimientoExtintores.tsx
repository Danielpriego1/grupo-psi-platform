import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flame, Shield, CheckCircle, Phone, Mail, User, ChevronLeft, ChevronRight, Wrench, AlertTriangle, FileCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const EXTINGUISHER_IMAGES = [
  { src: "/images/services/extintores-mantenimiento-banner.png", alt: "Mantenimiento preventivo – la mejor inversión para prevenir siniestros" },
  { src: "/images/services/extintor-recarga-detalle.jpeg", alt: "Extintor recargado con etiqueta PSI – detalle de instrucciones" },
  { src: "/images/services/extintores-grupo-psi.jpeg", alt: "Línea completa de extintores PQS ABC – desde 1 kg hasta unidades móviles" },
];

const SERVICES = [
  {
    icon: RefreshCw,
    title: "Recarga Certificada",
    description: "Recarga de extintores PQS ABC, CO₂, Tipo K, Halotron y espuma con agente extintor certificado y pesaje calibrado.",
  },
  {
    icon: Wrench,
    title: "Mantenimiento Preventivo",
    description: "Inspección visual, prueba de presión, revisión de manguera, válvula, manómetro y pasador de seguridad.",
  },
  {
    icon: AlertTriangle,
    title: "Mantenimiento Correctivo",
    description: "Cambio de válvulas, mangueras, manómetros, o-rings y pintura electrostática cuando se requiera.",
  },
  {
    icon: FileCheck,
    title: "Prueba Hidrostática",
    description: "Prueba de presión al cilindro conforme a NOM-154-SCFI para validar la integridad estructural del extintor.",
  },
];

const TYPES_SERVED = [
  "PQS ABC (1 kg – 70 kg)",
  "CO₂ (5 lb – 20 lb)",
  "Tipo K (cocinas industriales)",
  "Espuma AFFF",
  "Halotron (áreas sensibles)",
  "Unidades móviles (35 kg – 70 kg)",
];

const MantenimientoExtintores = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", notes: "" });

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % EXTINGUISHER_IMAGES.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + EXTINGUISHER_IMAGES.length) % EXTINGUISHER_IMAGES.length);

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(0,70%,45%,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium">
                <Flame className="h-4 w-4" />
                Recarga y Mantenimiento
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl leading-tight">
                Mantenimiento y Recarga de Extintores
              </h1>
              <p className="text-primary-foreground/80 text-lg max-w-lg">
                Servicio profesional de recarga, mantenimiento preventivo y correctivo para todo tipo de extintores. Cumplimos con la <strong>NOM-154-SCFI</strong> y certificamos cada equipo con etiqueta PSI.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#contacto">
                  <Button size="lg" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold">
                    Solicitar Servicio
                  </Button>
                </a>
                <Link to="/mantenimiento">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Agendar Recolección
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] md:aspect-[4/3] bg-background/5">
              <img
                src={EXTINGUISHER_IMAGES[currentImage].src}
                alt={EXTINGUISHER_IMAGES[currentImage].alt}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <p className="text-sm text-white/90 font-medium drop-shadow-lg max-w-[70%]">
                  {EXTINGUISHER_IMAGES[currentImage].alt}
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
              <div className="absolute bottom-14 left-4 flex gap-1.5">
                {EXTINGUISHER_IMAGES.map((_, i) => (
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
            Mantenimiento integral para extintores de todas las capacidades y agentes extintores.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <service.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-bold text-lg mb-2">{service.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Types of extinguishers */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-6">
                Tipos de Extintores que Atendemos
              </h2>
              <p className="text-muted-foreground mb-6">
                Trabajamos con todos los tipos y capacidades de extintores portátiles y móviles. Cada equipo recibe su etiqueta de servicio con fecha de recarga, próximo mantenimiento y datos del prestador.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                {TYPES_SERVED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-xl overflow-hidden aspect-video">
                <img src="/images/services/extintores-grupo-psi.jpeg" alt="Grupo de extintores PSI" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-xl overflow-hidden aspect-square">
                <img src="/images/services/extintor-recarga-detalle.jpeg" alt="Detalle extintor recargado" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-xl overflow-hidden aspect-square">
                <img src="/images/services/extintores-mantenimiento-banner.png" alt="Banner mantenimiento" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA to scheduling */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-border bg-card p-10 shadow-lg max-w-3xl mx-auto">
          <Flame className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-3">
            ¿Necesitas recolección de extintores?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Agenda la recolección directamente desde nuestra plataforma. Selecciona fecha, horario y ubicación — nosotros vamos por ellos.
          </p>
          <Link to="/mantenimiento">
            <Button size="lg" className="font-semibold">
              <Wrench className="mr-2 h-5 w-5" />
              Agendar Recolección
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contacto" className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                <Shield className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-2">
                Solicitar Cotización
              </h2>
              <p className="text-muted-foreground">
                Déjanos tus datos y te enviamos una cotización personalizada.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <div className="space-y-2">
                <Label htmlFor="ext-name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo *
                </Label>
                <Input
                  id="ext-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ext-phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono *
                  </Label>
                  <Input
                    id="ext-phone"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="993 155 0935"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ext-email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico *
                  </Label>
                  <Input
                    id="ext-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext-notes" className="text-sm font-medium">
                  Notas adicionales (tipo, cantidad, capacidad)
                </Label>
                <Textarea
                  id="ext-notes"
                  value={contact.notes}
                  onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                  placeholder="Ej: 10 extintores PQS de 4.5 kg, 5 de CO₂ 10 lb..."
                  rows={4}
                />
              </div>

              <Button type="submit" size="lg" className="w-full font-semibold">
                Enviar Solicitud
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MantenimientoExtintores;
