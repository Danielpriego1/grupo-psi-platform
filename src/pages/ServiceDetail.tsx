import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Wrench, User, Phone, Mail, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Service data matching Mantenimiento.tsx SERVICE_CATEGORIES
import {
  Flame, Wind, Cylinder, Shield, Zap, Box, Activity, Award, Droplets, Search,
} from "lucide-react";

const SERVICES = [
  {
    id: "extintores",
    label: "Extintores",
    icon: Flame,
    description: "Recarga, mantenimiento preventivo y correctivo para todo tipo de extintores conforme a NOM-154-SCFI.",
    longDescription: "Ofrecemos servicio integral de recarga certificada para extintores PQS ABC, CO₂, Tipo K, Halotron y espuma. Nuestro equipo realiza inspección visual, prueba de presión, revisión de manguera y válvula, además de cambio de componentes y pintura electrostática. Atendemos desde 1 kg hasta unidades móviles de 70 kg.",
    images: [
      { src: "/images/services/extintores-mantenimiento-banner.png", alt: "Mantenimiento preventivo de extintores" },
      { src: "/images/services/extintor-recarga-detalle.jpeg", alt: "Extintor recargado con etiqueta PSI" },
      { src: "/images/services/extintores-grupo-psi.jpeg", alt: "Línea completa de extintores PQS ABC" },
    ],
    details: [
      "Recarga certificada PQS ABC, CO₂, Tipo K, Halotron y espuma",
      "Inspección visual, prueba de presión, revisión de manguera y válvula",
      "Cambio de válvulas, mangueras, manómetros y pintura electrostática",
      "Atendemos desde 1 kg hasta unidades móviles de 70 kg",
    ],
    price: "Desde $150 MXN por unidad",
  },
  {
    id: "compresores",
    label: "Compresores",
    icon: Wind,
    description: "Mantenimiento de compresores de alta y baja presión para aire respirable Grado D.",
    longDescription: "Realizamos mantenimiento completo a compresores de aire respirable: cambio de filtros, aceite, empaques y revisión de válvulas de seguridad. Reparación de cabezales, bielas, pistones y baleros de cigüeñal. Trabajamos con marcas Bauer, Mako, Coltri, Nuvair, Alkin y Jordan.",
    images: [
      { src: "/images/services/compresores-linea.jpeg", alt: "Línea de compresores de aire respirable" },
      { src: "/images/services/compresor-desarme-1.jpg", alt: "Desarme de compresor – cabezal" },
      { src: "/images/services/compresor-filtro.jpg", alt: "Mantenimiento de filtro catalizador" },
      { src: "/images/services/compresor-ensamble.jpg", alt: "Ensamble de pistón y anillos" },
    ],
    details: [
      "Cambio de filtros, aceite, empaques y revisión de válvulas de seguridad",
      "Reparación de cabezales, bielas, pistones y baleros de cigüeñal",
      "Marcas: Bauer, Mako, Coltri, Nuvair, Alkin, Jordan",
      "Certificación de aire Grado D conforme a CGA G-7.1",
    ],
    price: "Cotización según modelo y alcance",
  },
  {
    id: "cascada",
    label: "Sistemas de Cascada",
    icon: Cylinder,
    description: "Mantenimiento integral de sistemas de cascada y bancos de cilindros de alta presión.",
    longDescription: "Inspección visual y prueba hidrostática de cilindros, revisión y reemplazo de válvulas de alta presión, verificación de mangueras y conexiones del manifold, recarga con aire respirable certificado Grado D. Incluye logística y maniobras para traslado de equipos.",
    images: [
      { src: "/images/services/maniobra-grua-cilindros.jpg", alt: "Maniobra con grúa – traslado de sistema de cascada" },
      { src: "/images/services/cilindros-operador.jpeg", alt: "Operador revisando sistema de cascada" },
      { src: "/images/services/cilindros-detalle.jpeg", alt: "Detalle de válvulas y conexiones en cascada" },
      { src: "/images/services/cilindros-rack-1.jpeg", alt: "Rack de cilindros" },
    ],
    details: [
      "Inspección visual y prueba hidrostática de cilindros",
      "Revisión y reemplazo de válvulas de alta presión",
      "Verificación de mangueras y conexiones del manifold",
      "Recarga con aire respirable certificado Grado D",
      "Logística y maniobras para traslado de equipos",
    ],
    price: "Cotización según cantidad de cilindros",
  },
  {
    id: "scba",
    label: "SCBA",
    icon: Shield,
    description: "Servicio completo para equipos autónomos de respiración: cilindros, máscaras y reguladores.",
    longDescription: "Prueba hidrostática de cilindros de 2216 PSI a 4500 PSI, inspección y certificación de máscaras y reguladores, prueba de fuga y ajuste de válvulas de demanda. Se entrega con etiqueta de servicio con fecha y próximo mantenimiento.",
    images: [
      { src: "/images/services/scba-equipo.jpeg", alt: "Equipo SCBA completo" },
      { src: "/images/services/scba-cilindros-mascaras.jpeg", alt: "Cilindros y máscaras SCBA" },
      { src: "/images/services/etiqueta-scba.jpeg", alt: "Etiqueta de servicio SCBA – Grupo PSI" },
    ],
    details: [
      "Prueba hidrostática de cilindros (2216 PSI a 4500 PSI)",
      "Inspección y certificación de máscaras y reguladores",
      "Prueba de fuga y ajuste de válvulas de demanda",
      "Etiqueta de servicio con fecha y próximo mantenimiento",
    ],
    price: "Desde $800 MXN por equipo",
  },
  {
    id: "escape-rapido",
    label: "Equipo de Escape Rápido",
    icon: Zap,
    description: "Mantenimiento y certificación de equipos de escape rápido (EEBA/ELSA) para evacuación de emergencia.",
    longDescription: "Inspección de cilindros y capuchas de evacuación, verificación de reguladores y flujo de aire, prueba de presión y recarga de cilindros. Se emite certificación con etiqueta de servicio.",
    images: [],
    details: [
      "Inspección de cilindros y capuchas de evacuación",
      "Verificación de reguladores y flujo de aire",
      "Prueba de presión y recarga de cilindros",
      "Certificación con etiqueta de servicio",
    ],
    price: "Cotización según modelo",
  },
  {
    id: "cajas-filtracion",
    label: "Cajas de Filtración",
    icon: Box,
    description: "Mantenimiento y cambio de elementos filtrantes para sistemas portátiles de purificación de aire.",
    longDescription: "Cambio de filtros de carbón activado, coalescentes y partículas. Verificación de manómetros y reguladores de presión. Prueba de pureza de aire a la salida del sistema. Trabajamos con marcas Honeywell, Bauer y Breathing Air Systems.",
    images: [
      { src: "/images/services/caja-filtracion-abierta.jpeg", alt: "Caja de filtración abierta – sistema de purificación portátil" },
      { src: "/images/services/caja-filtracion-conexiones.jpeg", alt: "Cajas de filtración – vista de conexiones" },
    ],
    details: [
      "Cambio de filtros de carbón activado, coalescentes y partículas",
      "Verificación de manómetros y reguladores de presión",
      "Prueba de pureza de aire a la salida del sistema",
      "Marcas: Honeywell, Bauer, Breathing Air Systems",
    ],
    price: "Cotización según sistema",
  },
  {
    id: "detectores",
    label: "Detectores Multigas",
    icon: Activity,
    description: "Calibración, bump test y mantenimiento de detectores portátiles y fijos de gases.",
    longDescription: "Calibración certificada con gas patrón trazable, bump test y verificación de sensores, reemplazo de sensores electroquímicos y catalíticos. Trabajamos con marcas Honeywell, MSA, Dräger e Industrial Scientific.",
    images: [
      { src: "/images/services/detector-multigas.jpeg", alt: "Detector multigas portátil" },
    ],
    details: [
      "Calibración certificada con gas patrón trazable",
      "Bump test y verificación de sensores",
      "Reemplazo de sensores electroquímicos y catalíticos",
      "Marcas: Honeywell, MSA, Dräger, Industrial Scientific",
    ],
    price: "Desde $1,200 MXN por detector",
  },
  {
    id: "certificaciones",
    label: "Certificaciones",
    icon: Award,
    description: "Emisión de certificados y etiquetas de servicio conforme a normas oficiales mexicanas.",
    longDescription: "Certificación NOM-154-SCFI para extintores, certificación de aire respirable Grado D (CGA G-7.1), etiquetas de servicio para SCBA, extintores y detectores. Incluye registros de mantenimiento y bitácoras de equipo.",
    images: [],
    details: [
      "Certificación NOM-154-SCFI para extintores",
      "Certificación de aire respirable Grado D (CGA G-7.1)",
      "Etiquetas de servicio para SCBA, extintores y detectores",
      "Registros de mantenimiento y bitácoras de equipo",
    ],
    price: "Desde $500 MXN por certificado",
  },
  {
    id: "prueba-hidrostatica",
    label: "Prueba Hidrostática",
    icon: Droplets,
    description: "Prueba de presión para validar la integridad estructural de cilindros y extintores.",
    longDescription: "Prueba a cilindros SCBA de acero, aluminio y fibra de carbono. Prueba a extintores conforme a NOM-154-SCFI. Prueba a cilindros de sistemas de cascada. Se entrega registro y documentación con número de serie.",
    images: [],
    details: [
      "Prueba a cilindros SCBA de acero, aluminio y fibra de carbono",
      "Prueba a extintores conforme a NOM-154-SCFI",
      "Prueba a cilindros de sistemas de cascada",
      "Registro y documentación con número de serie",
    ],
    price: "Desde $600 MXN por cilindro",
  },
  {
    id: "pureza-aire",
    label: "Prueba de Pureza de Aire",
    icon: Search,
    description: "Análisis certificado de calidad de aire respirable conforme a estándares Grado D.",
    longDescription: "Análisis completo que incluye: Oxígeno (19.5% – 23.5%), Monóxido de carbono máx. 10 ppm, Dióxido de carbono máx. 1,000 ppm, Vapor de aceite máx. 5 mg/m³, y punto de rocío con ausencia de olor/sabor.",
    images: [],
    details: [
      "Oxígeno: 19.5% – 23.5%",
      "Monóxido de carbono (CO): máx. 10 ppm",
      "Dióxido de carbono (CO₂): máx. 1,000 ppm",
      "Vapor de aceite: máx. 5 mg/m³",
      "Punto de rocío y ausencia de olor/sabor",
    ],
    price: "Desde $2,500 MXN por análisis",
  },
];

export function getServiceById(id: string) {
  return SERVICES.find((s) => s.id === id) || null;
}

export { SERVICES };

function ImageGallery({ images }: { images: { src: string; alt: string }[] }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return null;
  const next = () => setCurrent((p) => (p + 1) % images.length);
  const prev = () => setCurrent((p) => (p - 1 + images.length) % images.length);

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
      <img src={images[current].src} alt={images[current].alt} className="w-full h-full object-cover transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <p className="text-sm text-white/90 font-medium drop-shadow-lg max-w-[70%]">{images[current].alt}</p>
        {images.length > 1 && (
          <div className="flex gap-1.5">
            <button onClick={prev} className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-14 left-4 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={cn("h-1.5 rounded-full transition-all duration-300", i === current ? "w-6 bg-white" : "w-1.5 bg-white/40")} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteForm({ serviceName }: { serviceName: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", equipmentDetails: "", quantity: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    toast.success("¡Solicitud de cotización enviada! Te contactaremos pronto.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-3">
        <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
        <h3 className="text-lg font-bold">¡Solicitud enviada!</h3>
        <p className="text-sm text-muted-foreground">Nos pondremos en contacto contigo pronto con tu cotización para <strong>{serviceName}</strong>.</p>
        <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", equipmentDetails: "", quantity: "" }); }}>
          Enviar otra solicitud
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Cotización Rápida
        </h3>
        <p className="text-xs text-muted-foreground">Completa tus datos y te enviamos una cotización para <strong>{serviceName}</strong>.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre *
          </Label>
          <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Juan Pérez" required />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono *
          </Label>
          <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="55 1234 5678" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico *
        </Label>
        <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="correo@ejemplo.com" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cantidad de equipos</Label>
          <Input value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Ej: 10 unidades" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm font-medium">Detalles del equipo</Label>
          <Textarea value={form.equipmentDetails} onChange={(e) => setForm(p => ({ ...p, equipmentDetails: e.target.value }))} placeholder="Describe marca, modelo, capacidad o cualquier detalle relevante..." rows={3} />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full font-semibold">
        <Send className="h-4 w-4 mr-2" /> Solicitar Cotización
      </Button>
    </form>
  );
}

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const service = getServiceById(serviceId || "");

  if (!service) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Servicio no encontrado</h1>
          <Link to="/categoria/mantenimiento" className="text-primary hover:underline">Volver a Mantenimiento</Link>
        </div>
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back link */}
        <Link
          to="/categoria/mantenimiento"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mantenimiento
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {service.images.length > 0 ? (
              <ImageGallery images={service.images} />
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="h-20 w-20 text-muted-foreground/30" />
              </div>
            )}
          </motion.div>

          {/* Right: info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{service.label}</h1>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {service.longDescription}
            </p>

            {/* Price */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground mb-1">Precio</p>
              <p className="text-xl font-bold text-primary">{service.price}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">¿Qué incluye?</h2>
              <ul className="space-y-2">
                {service.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild size="lg" className="flex-1">
                <Link to="/mantenimiento">
                  <Wrench className="h-4 w-4 mr-2" />
                  Agendar servicio
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" })}>
                <Send className="h-4 w-4 mr-2" />
                Solicitar cotización
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Quote Form */}
        <motion.div
          id="quote-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16"
        >
          <QuoteForm serviceName={service.label} />
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceDetail;
