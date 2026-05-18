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
    price: "Cotización por WhatsApp",
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
    price: "Cotización por WhatsApp",
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
    price: "Cotización por WhatsApp",
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
    price: "Cotización por WhatsApp",
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
    price: "Cotización por WhatsApp",
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
    price: "Cotización por WhatsApp",
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
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link 
          to="/mantenimiento" 
          className="group mb-12 inline-flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-primary transition-all"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 group-hover:border-primary/50 group-hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4" />
          </div>
          VOLVER A SERVICIOS
        </Link>

        <div className="grid gap-16 lg:grid-cols-[1fr_400px] items-start">
          <div className="space-y-16">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-[0_0_40px_rgba(255,100,0,0.2)] flex items-center justify-center text-white">
                  <Icon className="h-10 w-10" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2 block">Servicio Especializado</span>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">{service.label}</h1>
                </div>
              </div>
              <p className="text-2xl text-gray-400 leading-relaxed font-medium max-w-3xl">{service.description}</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative">
                {service.images.length > 0 ? (
                  <ImageGallery images={service.images} />
                ) : (
                  <div className="aspect-[4/3] rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="h-32 w-32 text-white/10" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-10 bg-white/5 rounded-[3rem] p-10 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Wrench className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase">Detalles del Servicio</h2>
              </div>
              
              <p className="text-gray-300 leading-relaxed text-xl font-medium">{service.longDescription}</p>
              
              <div className="grid gap-6 sm:grid-cols-2 pt-6">
                {service.details.map((detail, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-gray-300 leading-snug">{detail}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:sticky lg:top-28">
            <div className="rounded-[2.5rem] border border-white/10 bg-card/80 backdrop-blur-2xl p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Inversión Estimada</span>
                  <div className="text-3xl font-black text-white tracking-tight">{service.price}</div>
                </div>
                
                <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" asChild>
                  <a href={`https://wa.me/5219931684717?text=${encodeURIComponent(`Hola, me interesa el servicio de: ${service.label}`)}`} target="_blank" rel="noopener noreferrer">
                    <Phone className="mr-2 h-5 w-5" />
                    Cotizar por WhatsApp
                  </a>
                </Button>

                <div className="pt-6 border-t border-white/5">
                  <QuoteForm serviceName={service.label} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
