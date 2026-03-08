import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocationMap, type LocationMapHandle } from "@/components/LocationMap";
import { useRef } from "react";
import {
  Wrench, CheckCircle, User, Phone, Mail, Package, MapPin, ChevronRight, Clock,
  AlertTriangle, Flame, Plus, Minus, Wind, Shield, ChevronLeft, Gauge, Timer, Award,
  RefreshCw, FileCheck, Droplets, Search, Zap, Box, Activity, ShieldCheck, Cylinder
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { mexicoStates, type MexicoState, type Municipality } from "@/data/mexicoLocations";

// ─── ALL SERVICE CATEGORIES ──────────────────────────────────
const SERVICE_CATEGORIES = [
  {
    id: "extintores",
    label: "Extintores",
    icon: Flame,
    color: "destructive",
    description: "Recarga, mantenimiento preventivo y correctivo para todo tipo de extintores. NOM-154-SCFI.",
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
  },
  {
    id: "compresores",
    label: "Compresores",
    icon: Wind,
    color: "primary",
    description: "Mantenimiento de compresores de alta y baja presión para aire respirable Grado D.",
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
  },
  {
    id: "cascada",
    label: "Sistemas de Cascada",
    icon: Cylinder,
    color: "primary",
    description: "Mantenimiento integral de sistemas de cascada y bancos de cilindros de alta presión.",
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
  },
  {
    id: "scba",
    label: "SCBA",
    icon: Shield,
    color: "primary",
    description: "Servicio completo para equipos autónomos de respiración: cilindros, máscaras y reguladores.",
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
  },
  {
    id: "escape-rapido",
    label: "Equipo de Escape Rápido",
    icon: Zap,
    color: "primary",
    description: "Mantenimiento y certificación de equipos de escape rápido (EEBA/ELSA) para evacuación de emergencia.",
    images: [],
    details: [
      "Inspección de cilindros y capuchas de evacuación",
      "Verificación de reguladores y flujo de aire",
      "Prueba de presión y recarga de cilindros",
      "Certificación con etiqueta de servicio",
    ],
  },
  {
    id: "cajas-filtracion",
    label: "Cajas de Filtración",
    icon: Box,
    color: "primary",
    description: "Mantenimiento y cambio de elementos filtrantes para sistemas portátiles de purificación de aire.",
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
  },
  {
    id: "detectores",
    label: "Detectores Multigas",
    icon: Activity,
    color: "primary",
    description: "Calibración, bump test y mantenimiento de detectores portátiles y fijos de gases.",
    images: [
      { src: "/images/services/detector-multigas.jpeg", alt: "Detector multigas portátil" },
    ],
    details: [
      "Calibración certificada con gas patrón trazable",
      "Bump test y verificación de sensores",
      "Reemplazo de sensores electroquímicos y catalíticos",
      "Marcas: Honeywell, MSA, Dräger, Industrial Scientific",
    ],
  },
  {
    id: "certificaciones",
    label: "Certificaciones",
    icon: Award,
    color: "primary",
    description: "Emisión de certificados y etiquetas de servicio conforme a normas oficiales mexicanas.",
    images: [],
    details: [
      "Certificación NOM-154-SCFI para extintores",
      "Certificación de aire respirable Grado D (CGA G-7.1)",
      "Etiquetas de servicio para SCBA, extintores y detectores",
      "Registros de mantenimiento y bitácoras de equipo",
    ],
  },
  {
    id: "prueba-hidrostatica",
    label: "Prueba Hidrostática",
    icon: Droplets,
    color: "primary",
    description: "Prueba de presión para validar la integridad estructural de cilindros y extintores.",
    images: [],
    details: [
      "Prueba a cilindros SCBA de acero, aluminio y fibra de carbono",
      "Prueba a extintores conforme a NOM-154-SCFI",
      "Prueba a cilindros de sistemas de cascada",
      "Registro y documentación con número de serie",
    ],
  },
  {
    id: "pureza-aire",
    label: "Prueba de Pureza de Aire",
    icon: Search,
    color: "primary",
    description: "Análisis certificado de calidad de aire respirable conforme a estándares Grado D.",
    images: [],
    details: [
      "Oxígeno: 19.5% – 23.5%",
      "Monóxido de carbono (CO): máx. 10 ppm",
      "Dióxido de carbono (CO₂): máx. 1,000 ppm",
      "Vapor de aceite: máx. 5 mg/m³",
      "Punto de rocío y ausencia de olor/sabor",
    ],
  },
];

// ─── AGENDAR DATA ────────────────────────────────────────────
const EXTINGUISHER_TYPES = [
  { id: "pqs", label: "PQS ABC", description: "Polvo Químico Seco" },
  { id: "co2", label: "CO₂", description: "Dióxido de carbono" },
  { id: "tipo-k", label: "Tipo K", description: "Cocinas y aceites" },
  { id: "agua", label: "Agua", description: "Clase A" },
  { id: "espuma", label: "Espuma", description: "Líquidos inflamables" },
  { id: "halotron", label: "Halotron", description: "Sin residuo" },
];

const WEIGHT_OPTIONS = ["1 kg", "2 kg", "4.5 kg", "6 kg", "9 kg", "12 kg", "50 kg", "70 kg", "2.5 lbs", "5 lbs", "10 lbs", "15 lbs", "20 lbs"];

const EQUIPMENT_CATEGORIES = [
  { id: "extintores", label: "Extintores", icon: "🧯", image: "", description: "Recarga y mantenimiento" },
  { id: "scba", label: "SCBA", icon: "", image: "/images/services/scba-equipo.jpeg", description: "Cilindros de aire respirable" },
  { id: "detector-multigas", label: "Detectores Multigas", icon: "", image: "/images/services/detector-multigas.jpeg", description: "Calibración y mantenimiento" },
  { id: "compresores", label: "Compresores", icon: "", image: "/images/services/compresores-linea.jpeg", description: "Aire respirable Grado D" },
  { id: "cascada", label: "Sistemas de Cascada", icon: "", image: "/images/services/cilindros-rack-1.jpeg", description: "Bancos de cilindros" },
  { id: "escape-rapido", label: "Escape Rápido", icon: "⚡", image: "", description: "EEBA/ELSA" },
  { id: "cajas-filtracion", label: "Cajas de Filtración", icon: "", image: "/images/services/caja-filtracion-abierta.jpeg", description: "Sistemas de purificación" },
  { id: "prueba-hidrostatica", label: "Prueba Hidrostática", icon: "💧", image: "", description: "Cilindros y extintores" },
  { id: "pureza-aire", label: "Pureza de Aire", icon: "🔬", image: "", description: "Análisis Grado D" },
];

const SCBA_PSI_OPTIONS = ["2216 PSI", "3000 PSI", "4500 PSI", "200 BAR", "300 BAR"];
const SCBA_MINUTES_OPTIONS = ["5 min", "10 min", "15 min", "30 min", "45 min", "60 min"];

interface TimeSlot { id: string; label: string; startHour: number; endHour: number; maxCapacity: number; }

const TIME_SLOTS: TimeSlot[] = [
  { id: "morning-1", label: "8:00 – 9:30", startHour: 8, endHour: 9.5, maxCapacity: 3 },
  { id: "morning-2", label: "9:30 – 11:00", startHour: 9.5, endHour: 11, maxCapacity: 3 },
  { id: "morning-3", label: "11:00 – 12:30", startHour: 11, endHour: 12.5, maxCapacity: 3 },
  { id: "afternoon-1", label: "12:30 – 14:00", startHour: 12.5, endHour: 14, maxCapacity: 2 },
  { id: "afternoon-2", label: "14:00 – 15:30", startHour: 14, endHour: 15.5, maxCapacity: 3 },
  { id: "afternoon-3", label: "15:30 – 17:00", startHour: 15.5, endHour: 17, maxCapacity: 3 },
];

const getSimulatedBookings = (dateStr: string): Record<string, number> => {
  const seed = dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bookings: Record<string, number> = {};
  TIME_SLOTS.forEach((slot, i) => {
    const pseudoRandom = ((seed * (i + 1) * 7) % 13);
    if (pseudoRandom > 10) bookings[slot.id] = slot.maxCapacity;
    else if (pseudoRandom > 6) bookings[slot.id] = slot.maxCapacity - 1;
    else if (pseudoRandom > 3) bookings[slot.id] = Math.floor(slot.maxCapacity / 2);
    else bookings[slot.id] = 0;
  });
  return bookings;
};

type SlotAvailability = "available" | "limited" | "unavailable";

interface EquipmentItem {
  category: string;
  type: string; weight: string; quantity: number;
  scbaLastMaintenance: string; scbaPsi: string; scbaMinutes: string;
  detectorBrand: string; detectorGases: string; detectorLastMaintenance: string;
  notes: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  phone: z.string().trim().min(10, "Ingresa un teléfono válido de 10 dígitos").max(15).regex(/^[\d\s\-+()]+$/, "Teléfono inválido"),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
});

type ContactData = z.infer<typeof contactSchema>;

// ─── IMAGE GALLERY COMPONENT ────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Mantenimiento = () => {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  // ─── Agendar state ───
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [contact, setContact] = useState<ContactData>({ name: "", phone: "", email: "" });
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactData, string>>>({});
  const [step, setStep] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const defaultEquipmentItem: EquipmentItem = { category: "", type: "", weight: "", quantity: 1, scbaLastMaintenance: "", scbaPsi: "", scbaMinutes: "", detectorBrand: "", detectorGases: "", detectorLastMaintenance: "", notes: "" };
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([{ ...defaultEquipmentItem }]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  const [selectedState, setSelectedState] = useState<MexicoState | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [locationSubStep, setLocationSubStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const mapRef = useRef<LocationMapHandle>(null);

  // ─── Contact form ───
  const [serviceContact, setServiceContact] = useState({ name: "", phone: "", email: "", notes: "" });

  const updateContact = (field: keyof ContactData, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    if (contactErrors[field]) setContactErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateEquipmentItem = (index: number, field: keyof EquipmentItem, value: string | number) => {
    setEquipmentItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    if (equipmentError) setEquipmentError(null);
  };

  const addEquipmentItem = () => setEquipmentItems(prev => [...prev, { ...defaultEquipmentItem }]);
  const removeEquipmentItem = (index: number) => { if (equipmentItems.length > 1) setEquipmentItems(prev => prev.filter((_, i) => i !== index)); };

  const handleSubmit = () => {
    const result = contactSchema.safeParse(contact);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactData, string>> = {};
      result.error.errors.forEach((e) => { const field = e.path[0] as keyof ContactData; if (!fieldErrors[field]) fieldErrors[field] = e.message; });
      setContactErrors(fieldErrors);
      setStep(1);
      toast.error("Por favor completa todos los campos correctamente");
      return;
    }
    const hasValid = equipmentItems.some(item => {
      if (item.category === "extintores") return item.type && item.weight && item.quantity > 0;
      if (item.category === "scba") return item.scbaPsi && item.scbaMinutes && item.quantity > 0;
      if (item.category === "detector-multigas") return item.detectorBrand && item.quantity > 0;
      if (item.category) return item.quantity > 0;
      return false;
    });
    if (!hasValid) { setEquipmentError("Agrega al menos un equipo con todos los campos requeridos"); setStep(1); return; }
    if (!date || !selectedTimeSlot) { toast.error("Selecciona una fecha y horario para la recolección"); setStep(2); return; }
    if (!location) { toast.error("Fija tu ubicación en el mapa"); return; }
    const slotLabel = TIME_SLOTS.find(s => s.id === selectedTimeSlot)?.label || "";
    const totalUnits = equipmentItems.reduce((sum, item) => sum + item.quantity, 0);
    toast.success(`¡Solicitud enviada! ${totalUnits} equipo(s) programados para recolección el ${format(date, "d 'de' MMMM", { locale: es })} de ${slotLabel}.`);
  };

  const hasValidEquipment = equipmentItems.some(item => {
    if (item.category === "extintores") return item.type && item.weight && item.quantity > 0;
    if (item.category === "scba") return item.scbaPsi && item.scbaMinutes && item.quantity > 0;
    if (item.category === "detector-multigas") return item.detectorBrand && item.quantity > 0;
    if (item.category) return item.quantity > 0;
    return false;
  });
  const isStep1Complete = contact.name.length >= 2 && contact.phone.length >= 10 && contact.email.includes("@") && hasValidEquipment;

  const slotAvailabilities = useMemo(() => {
    if (!date) return {};
    const dateStr = format(date, "yyyy-MM-dd");
    const bookings = getSimulatedBookings(dateStr);
    const result: Record<string, { availability: SlotAvailability; remaining: number; total: number; booked: number }> = {};
    TIME_SLOTS.forEach((slot) => {
      const booked = bookings[slot.id] || 0;
      const remaining = slot.maxCapacity - booked;
      let availability: SlotAvailability = "available";
      if (remaining <= 0) availability = "unavailable";
      else if (remaining === 1) availability = "limited";
      result[slot.id] = { availability, remaining, total: slot.maxCapacity, booked };
    });
    return result;
  }, [date]);

  const isStep2Complete = !!date && !!selectedTimeSlot;
  const isLocationComplete = !!location;

  const handleSelectState = (state: MexicoState) => { setSelectedState(state); setSelectedMunicipality(null); setSelectedPostalCode(null); setLocation(null); setLocationSubStep(2); };
  const handleSelectMunicipality = (muni: Municipality) => { setSelectedMunicipality(muni); setSelectedPostalCode(null); setLocation(null); setLocationSubStep(3); };
  const handleSelectPostalCode = (cp: string) => { setSelectedPostalCode(cp); setLocation(null); setLocationSubStep(4); };

  const handleServiceContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceContact.name || !serviceContact.phone || !serviceContact.email) {
      toast.error("Completa todos los campos obligatorios"); return;
    }
    toast.success("¡Solicitud enviada! Nos pondremos en contacto contigo pronto.");
    setServiceContact({ name: "", phone: "", email: "", notes: "" });
  };

  const toggleService = (id: string) => {
    setExpandedService(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* ─── HERO BANNER ─── */}
      <section className="relative overflow-hidden h-[60vh] min-h-[400px] max-h-[600px]">
        <img
          src="/images/services/plataforma-industrial.jpeg"
          alt="Servicios de mantenimiento industrial – plataforma offshore"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-foreground/30" />
        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-12 px-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl text-primary-foreground mb-3">
            Centro de Servicios y Mantenimiento
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-6">
            Mantenimiento profesional y certificado para todo tu equipo de seguridad industrial. Extintores, SCBA, compresores, detectores y más.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="font-semibold" onClick={() => { setShowScheduler(true); setTimeout(() => document.getElementById("agendar-section")?.scrollIntoView({ behavior: "smooth" }), 100); }}>
              <Wrench className="mr-2 h-4 w-4" /> Agendar Servicio
            </Button>
            <a href="#servicios">
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20">
                Ver Servicios
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ─── */}
      <section id="servicios" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-3">Nuestros Servicios</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Selecciona un servicio para ver más detalles. Ofrecemos cobertura integral para toda tu operación.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {SERVICE_CATEGORIES.map((cat) => {
            const isExpanded = expandedService === cat.id;
            const IconComp = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => toggleService(cat.id)}
                className={cn(
                  "relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300 group",
                  isExpanded
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                  isExpanded ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
                )}>
                  <IconComp className={cn("h-5 w-5", isExpanded ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                </div>
                <h3 className="font-bold text-sm leading-tight">{cat.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{cat.description}</p>
                {isExpanded && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── EXPANDED SERVICE DETAIL ─── */}
      {expandedService && (() => {
        const service = SERVICE_CATEGORIES.find(s => s.id === expandedService);
        if (!service) return null;
        const IconComp = service.icon;
        return (
          <section className="container mx-auto px-4 pb-16 animate-fade-in">
            <div className="rounded-2xl border border-primary/20 bg-card shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: Info */}
                <div className="p-8 md:p-10 space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                    <IconComp className="h-4 w-4" />
                    {service.label}
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                    {service.label}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  <ul className="space-y-3">
                    {service.details.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button className="font-semibold" onClick={() => { setShowScheduler(true); setTimeout(() => document.getElementById("agendar-section")?.scrollIntoView({ behavior: "smooth" }), 100); }}>
                      <Wrench className="mr-2 h-4 w-4" /> Agendar Servicio
                    </Button>
                    <a href="#contacto">
                      <Button variant="outline">Solicitar Cotización</Button>
                    </a>
                  </div>
                </div>
                {/* Right: Gallery */}
                <div className="p-6 md:p-8 flex items-center">
                  {service.images.length > 0 ? (
                    <ImageGallery images={service.images} />
                  ) : (
                    <div className="w-full aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <IconComp className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                        <p className="text-sm text-muted-foreground">Contáctanos para más información</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ─── AGENDAR SECTION ─── */}
      <section id="agendar-section" className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-3">Agendar Servicio</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Programa la recolección de tus equipos para mantenimiento, recarga o certificación.
            </p>
          </div>

          {!showScheduler ? (
            <div className="text-center">
              <Button size="lg" className="font-semibold" onClick={() => setShowScheduler(true)}>
                <Wrench className="mr-2 h-5 w-5" /> Iniciar Agendamiento
              </Button>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              {/* Progress steps */}
              <div className="mx-auto mb-10 flex items-center justify-center gap-2">
                {[{ n: 1, label: "Datos" }, { n: 2, label: "Fecha" }, { n: 3, label: "Ubicación" }].map(({ n, label }) => (
                  <button
                    key={n}
                    onClick={() => setStep(n)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
                      step === n ? "bg-primary text-primary-foreground shadow-lg"
                        : n < step || (n === 1 && isStep1Complete) || (n === 2 && isStep2Complete)
                          ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {(n < step || (n === 1 && isStep1Complete) || (n === 2 && isStep2Complete)) && n !== step
                      ? <CheckCircle className="h-4 w-4" />
                      : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs">{n}</span>}
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Step 1: Contact + Equipment */}
              {step === 1 && (
                <div className="animate-fade-in space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
                  <h2 className="text-xl font-bold">Datos de contacto</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium"><User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo</Label>
                      <Input id="name" value={contact.name} onChange={(e) => updateContact("name", e.target.value)} placeholder="Juan Pérez" maxLength={100} className={cn(contactErrors.name && "border-destructive")} />
                      {contactErrors.name && <p className="text-xs text-destructive">{contactErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono</Label>
                      <Input id="phone" value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} placeholder="55 1234 5678" maxLength={15} className={cn(contactErrors.phone && "border-destructive")} />
                      {contactErrors.phone && <p className="text-xs text-destructive">{contactErrors.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico</Label>
                    <Input id="email" type="email" value={contact.email} onChange={(e) => updateContact("email", e.target.value)} placeholder="correo@ejemplo.com" maxLength={255} className={cn(contactErrors.email && "border-destructive")} />
                    {contactErrors.email && <p className="text-xs text-destructive">{contactErrors.email}</p>}
                  </div>

                  {/* Equipment */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Equipo a recolectar</h2>
                      <span className="text-xs text-muted-foreground">{equipmentItems.length} equipo(s)</span>
                    </div>
                    {equipmentError && <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {equipmentError}</p>}

                    <div className="space-y-4">
                      {equipmentItems.map((item, index) => (
                        <div key={index} className="rounded-xl border border-border bg-muted/30 p-4 space-y-4 relative">
                          {equipmentItems.length > 1 && (
                            <button onClick={() => removeEquipmentItem(index)} className="absolute top-3 right-3 h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipo {index + 1}</span>

                          {/* Category selector */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Tipo de servicio</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {EQUIPMENT_CATEGORIES.map((cat) => (
                                <button key={cat.id} onClick={() => updateEquipmentItem(index, "category", cat.id)} className={cn(
                                  "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                                  item.category === cat.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                )}>
                                  <span className="flex items-center gap-1.5 text-xs font-medium">
                                    {cat.image ? <img src={cat.image} alt={cat.label} className="h-4 w-4 rounded object-cover" /> : <span className="text-sm">{cat.icon}</span>}
                                    {cat.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground leading-tight pl-5">{cat.description}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Extintores fields */}
                          {item.category === "extintores" && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Tipo de extintor</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {EXTINGUISHER_TYPES.map((type) => (
                                    <button key={type.id} onClick={() => updateEquipmentItem(index, "type", type.id)} className={cn(
                                      "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                                      item.type === type.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                    )}>
                                      <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <span className={cn("h-2 w-2 rounded-full", item.type === type.id ? "bg-primary" : "bg-muted-foreground/30")} />
                                        {type.label}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground leading-tight pl-3.5">{type.description}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Peso / Capacidad</Label>
                                <div className="flex flex-wrap gap-2">
                                  {WEIGHT_OPTIONS.map((w) => (
                                    <button key={w} onClick={() => updateEquipmentItem(index, "weight", w)} className={cn(
                                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                      item.weight === w ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                    )}>{w}</button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* SCBA fields */}
                          {item.category === "scba" && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Fecha de último mantenimiento</Label>
                                <Input type="date" value={item.scbaLastMaintenance} onChange={(e) => updateEquipmentItem(index, "scbaLastMaintenance", e.target.value)} className="max-w-[220px]" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Capacidad PSI</Label>
                                <div className="flex flex-wrap gap-2">
                                  {SCBA_PSI_OPTIONS.map((psi) => (
                                    <button key={psi} onClick={() => updateEquipmentItem(index, "scbaPsi", psi)} className={cn(
                                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                      item.scbaPsi === psi ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                    )}>{psi}</button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Capacidad en Minutos</Label>
                                <div className="flex flex-wrap gap-2">
                                  {SCBA_MINUTES_OPTIONS.map((min) => (
                                    <button key={min} onClick={() => updateEquipmentItem(index, "scbaMinutes", min)} className={cn(
                                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                      item.scbaMinutes === min ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                    )}>{min}</button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Detector multigas fields */}
                          {item.category === "detector-multigas" && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Marca del detector</Label>
                                <Input value={item.detectorBrand} onChange={(e) => updateEquipmentItem(index, "detectorBrand", e.target.value)} placeholder="Ej: Honeywell, MSA, Dräger..." maxLength={100} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Gases a detectar</Label>
                                <Input value={item.detectorGases} onChange={(e) => updateEquipmentItem(index, "detectorGases", e.target.value)} placeholder="Ej: O₂, CO, H₂S, LEL (4 gases)" maxLength={200} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Fecha de último mantenimiento</Label>
                                <Input type="date" value={item.detectorLastMaintenance} onChange={(e) => updateEquipmentItem(index, "detectorLastMaintenance", e.target.value)} className="max-w-[220px]" />
                              </div>
                            </>
                          )}

                          {/* Generic notes for other categories */}
                          {item.category && !["extintores", "scba", "detector-multigas"].includes(item.category) && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Detalles del equipo</Label>
                              <Textarea value={item.notes} onChange={(e) => updateEquipmentItem(index, "notes", e.target.value)} placeholder="Describe marca, modelo, capacidad o cualquier detalle relevante..." rows={2} maxLength={500} />
                            </div>
                          )}

                          {/* Quantity */}
                          {item.category && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Cantidad</Label>
                              <div className="flex items-center gap-3">
                                <button onClick={() => updateEquipmentItem(index, "quantity", Math.max(1, item.quantity - 1))} className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                                <span className="min-w-[2rem] text-center text-lg font-bold">{item.quantity}</span>
                                <button onClick={() => updateEquipmentItem(index, "quantity", Math.min(50, item.quantity + 1))} className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                                <span className="text-xs text-muted-foreground">unidades</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" size="sm" onClick={addEquipmentItem} className="w-full border-dashed">
                      <Plus className="h-4 w-4 mr-1" /> Agregar otro equipo
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium"><Package className="h-3.5 w-3.5 text-muted-foreground" /> Notas adicionales (opcional)</Label>
                      <Textarea id="notes" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Ej: Algunos equipos tienen daño visible, necesito factura..." maxLength={500} rows={2} />
                      <p className="text-xs text-muted-foreground text-right">{additionalNotes.length}/500</p>
                    </div>
                  </div>

                  <Button className="w-full transition-transform hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                    const result = contactSchema.safeParse(contact);
                    if (!result.success) {
                      const fieldErrors: Partial<Record<keyof ContactData, string>> = {};
                      result.error.errors.forEach((e) => { const field = e.path[0] as keyof ContactData; if (!fieldErrors[field]) fieldErrors[field] = e.message; });
                      setContactErrors(fieldErrors);
                      return;
                    }
                    if (!hasValidEquipment) { setEquipmentError("Completa los campos requeridos de al menos un equipo"); return; }
                    setContactErrors({}); setEquipmentError(null); setStep(2);
                  }}>
                    Siguiente → Seleccionar fecha
                  </Button>
                </div>
              )}

              {/* Step 2: Calendar + Time Slots */}
              {step === 2 && (
                <div className="animate-fade-in space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
                  <h2 className="text-xl font-bold">Selecciona fecha y horario de recolección</h2>
                  <div className="flex justify-center">
                    <div className="overflow-hidden rounded-xl border border-border">
                      <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setSelectedTimeSlot(null); }} locale={es} className={cn("p-3 pointer-events-auto")} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} />
                    </div>
                  </div>
                  {date && (
                    <div className="animate-fade-in space-y-4">
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                        <CheckCircle className="h-4 w-4" />
                        {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Horarios disponibles</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Disponible</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Último lugar</span>
                          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive/60" /> Sin disponibilidad</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {TIME_SLOTS.map((slot) => {
                            const info = slotAvailabilities[slot.id];
                            if (!info) return null;
                            const isSelected = selectedTimeSlot === slot.id;
                            const isUnavailable = info.availability === "unavailable";
                            const isLimited = info.availability === "limited";
                            return (
                              <button key={slot.id} disabled={isUnavailable} onClick={() => setSelectedTimeSlot(slot.id)} className={cn(
                                "relative flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-300",
                                isUnavailable ? "border-border/50 bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                                  : isSelected ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                                  : isLimited ? "border-amber-400/50 bg-amber-50 text-amber-800 hover:border-amber-500 hover:scale-[1.02] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700"
                                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02]"
                              )}>
                                <span className="font-semibold">{slot.label}</span>
                                <span className={cn("text-[10px] font-normal", isSelected ? "text-primary-foreground/80" : isUnavailable ? "text-muted-foreground" : isLimited ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                                  {isUnavailable ? <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Ocupado</span> : isLimited ? "¡Último lugar!" : `${info.remaining} de ${info.total} disponibles`}
                                </span>
                                <span className={cn("absolute top-2 right-2 h-2 w-2 rounded-full", isUnavailable ? "bg-destructive/60" : isLimited ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                              </button>
                            );
                          })}
                        </div>
                        {selectedTimeSlot && (
                          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary animate-fade-in">
                            <Clock className="h-4 w-4" />
                            Horario seleccionado: {TIME_SLOTS.find(s => s.id === selectedTimeSlot)?.label}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Datos</Button>
                    <Button className="flex-1 transition-transform hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                      if (!date) { toast.error("Selecciona una fecha"); return; }
                      if (!selectedTimeSlot) { toast.error("Selecciona un horario disponible"); return; }
                      setStep(3);
                    }}>Siguiente → Ubicación</Button>
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <div className="animate-fade-in space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
                  <h2 className="text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Ubicación de recolección</h2>

                  {/* Breadcrumb */}
                  <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    <button onClick={() => { setLocationSubStep(1); setSelectedState(null); setSelectedMunicipality(null); setSelectedPostalCode(null); setLocation(null); }} className={cn("rounded-md px-2 py-1 transition-colors", locationSubStep === 1 ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted")}>Estado</button>
                    {selectedState && (<><ChevronRight className="h-3 w-3" /><button onClick={() => { setLocationSubStep(2); setSelectedMunicipality(null); setSelectedPostalCode(null); setLocation(null); }} className={cn("rounded-md px-2 py-1 transition-colors", locationSubStep === 2 ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted")}>{selectedState.name}</button></>)}
                    {selectedMunicipality && (<><ChevronRight className="h-3 w-3" /><button onClick={() => { setLocationSubStep(3); setSelectedPostalCode(null); setLocation(null); }} className={cn("rounded-md px-2 py-1 transition-colors", locationSubStep === 3 ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted")}>{selectedMunicipality.name}</button></>)}
                    {selectedPostalCode && (<><ChevronRight className="h-3 w-3" /><span className={cn("rounded-md px-2 py-1", locationSubStep === 4 ? "bg-primary text-primary-foreground font-semibold" : "")}>CP {selectedPostalCode}</span></>)}
                  </div>

                  {locationSubStep === 1 && (
                    <div className="animate-fade-in">
                      <p className="mb-3 text-sm font-medium text-muted-foreground">Selecciona tu estado</p>
                      <div className="space-y-1 rounded-xl border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                        {mexicoStates.map((state, i) => (
                          <button key={state.name} onClick={() => handleSelectState(state)} onMouseEnter={() => setHoveredItem(state.name)} onMouseLeave={() => setHoveredItem(null)} className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-300 group",
                            hoveredItem === state.name ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground scale-[1.01]" : "bg-card text-foreground hover:bg-muted/50",
                            i < mexicoStates.length - 1 && "border-b border-border/50"
                          )} style={{ animationDelay: `${i * 30}ms`, animation: "fadeInUp 0.3s ease forwards", opacity: 0 }}>
                            <span className={cn("h-2.5 w-2.5 rounded-full transition-all duration-300 shrink-0", hoveredItem === state.name ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-primary/40")} />
                            <span className="flex-1">{state.name}</span>
                            <ChevronRight className={cn("h-4 w-4 transition-all duration-300", hoveredItem === state.name ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationSubStep === 2 && selectedState && (
                    <div className="animate-fade-in">
                      <p className="mb-3 text-sm font-medium text-muted-foreground">Municipio en {selectedState.name}</p>
                      <div className="space-y-1 rounded-xl border border-border overflow-hidden max-h-[400px] overflow-y-auto">
                        {selectedState.municipalities.map((muni, i) => (
                          <button key={muni.name} onClick={() => handleSelectMunicipality(muni)} onMouseEnter={() => setHoveredItem(muni.name)} onMouseLeave={() => setHoveredItem(null)} className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-300",
                            hoveredItem === muni.name ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground scale-[1.01]" : "bg-card text-foreground hover:bg-muted/50",
                            i < selectedState.municipalities.length - 1 && "border-b border-border/50"
                          )} style={{ animationDelay: `${i * 30}ms`, animation: "fadeInUp 0.3s ease forwards", opacity: 0 }}>
                            <span className={cn("h-2.5 w-2.5 rounded-full transition-all duration-300 shrink-0", hoveredItem === muni.name ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-primary/40")} />
                            <span className="flex-1">{muni.name}</span>
                            <ChevronRight className={cn("h-4 w-4 transition-all duration-300", hoveredItem === muni.name ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationSubStep === 3 && selectedMunicipality && (
                    <div className="animate-fade-in">
                      <p className="mb-3 text-sm font-medium text-muted-foreground">Código postal en {selectedMunicipality.name}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedMunicipality.postalCodes.map((cp, i) => (
                          <button key={cp} onClick={() => handleSelectPostalCode(cp)} onMouseEnter={() => setHoveredItem(cp)} onMouseLeave={() => setHoveredItem(null)} className={cn(
                            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                            hoveredItem === cp ? "border-primary bg-primary/10 text-primary scale-105 shadow-lg shadow-primary/10" : "border-border bg-card text-foreground hover:border-primary/30"
                          )} style={{ animationDelay: `${i * 50}ms`, animation: "fadeInUp 0.3s ease forwards", opacity: 0 }}>
                            {cp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationSubStep === 4 && selectedState && (
                    <div className="animate-fade-in space-y-4">
                      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                        <p className="text-sm font-medium text-primary flex items-center gap-2"><MapPin className="h-4 w-4" /> Ubica tu dirección exacta en el mapa</p>
                        <p className="text-xs text-muted-foreground mt-1">{selectedState.name} → {selectedMunicipality?.name} → CP {selectedPostalCode}</p>
                      </div>
                      <LocationMap onLocationSelect={(lat, lng) => setLocation({ lat, lng })} defaultCenter={selectedState.coords} />
                      {location && (
                        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary animate-fade-in">
                          <CheckCircle className="h-4 w-4" /> Ubicación fijada correctamente
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Fecha</Button>
                    <Button size="lg" className="flex-1 transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={!isLocationComplete} onClick={handleSubmit}>
                      <Wrench className="mr-2 h-5 w-5" /> Solicitar Recolección
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── CONTACT FORM ─── */}
      <section id="contacto" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl mb-2">Solicitar Cotización</h2>
              <p className="text-muted-foreground">Déjanos tus datos y te enviamos una cotización personalizada para el servicio que necesites.</p>
            </div>
            <form onSubmit={handleServiceContactSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium"><User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo *</Label>
                <Input value={serviceContact.name} onChange={(e) => setServiceContact(prev => ({ ...prev, name: e.target.value }))} placeholder="Juan Pérez" required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono *</Label>
                  <Input value={serviceContact.phone} onChange={(e) => setServiceContact(prev => ({ ...prev, phone: e.target.value }))} placeholder="993 155 0935" required />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico *</Label>
                  <Input type="email" value={serviceContact.email} onChange={(e) => setServiceContact(prev => ({ ...prev, email: e.target.value }))} placeholder="correo@ejemplo.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Detalles del servicio</Label>
                <Textarea value={serviceContact.notes} onChange={(e) => setServiceContact(prev => ({ ...prev, notes: e.target.value }))} placeholder="Describe los equipos, cantidades y tipo de servicio que necesitas..." rows={4} />
              </div>
              <Button type="submit" size="lg" className="w-full font-semibold">Enviar Solicitud</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Mantenimiento;
