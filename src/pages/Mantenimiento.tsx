import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocationMap } from "@/components/LocationMap";
import { Wrench, CheckCircle, User, Phone, Mail, Package, MapPin, ChevronRight, Clock, AlertTriangle, Flame, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { mexicoStates, type MexicoState, type Municipality } from "@/data/mexicoLocations";

// Equipment options
const EXTINGUISHER_TYPES = [
  { id: "pqs", label: "PQS ABC", description: "Polvo Químico Seco – el más común" },
  { id: "co2", label: "CO₂", description: "Dióxido de carbono – equipos eléctricos" },
  { id: "tipo-k", label: "Tipo K", description: "Para cocinas y aceites" },
  { id: "agua", label: "Agua", description: "Para materiales sólidos (clase A)" },
  { id: "espuma", label: "Espuma", description: "Para líquidos inflamables" },
  { id: "halotron", label: "Halotron", description: "Sin residuo – electrónicos sensibles" },
];

const WEIGHT_OPTIONS = [
  "1 kg", "2 kg", "4.5 kg", "6 kg", "9 kg", "12 kg", "50 kg", "70 kg",
  "2.5 lbs", "5 lbs", "10 lbs", "15 lbs", "20 lbs",
];

// Equipment categories
const EQUIPMENT_CATEGORIES = [
  { id: "extintores", label: "Extintores", icon: "🧯", image: "", description: "Recarga y mantenimiento" },
  { id: "scba", label: "Equipos Autónomos (SCBA)", icon: "", image: "/images/services/scba-equipo.jpeg", description: "Cilindros de aire respirable" },
  { id: "detector-multigas", label: "Detectores Multigas", icon: "", image: "/images/services/detector-multigas.jpeg", description: "Calibración y mantenimiento" },
];

const SCBA_PSI_OPTIONS = ["2216 PSI", "3000 PSI", "4500 PSI", "200 BAR", "300 BAR"];
const SCBA_MINUTES_OPTIONS = ["5 min", "10 min", "15 min", "30 min", "45 min", "60 min"];

// Time slot definitions with capacity logic
interface TimeSlot {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  maxCapacity: number;
}

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
  // Extintores fields
  type: string;
  weight: string;
  quantity: number;
  // SCBA fields
  scbaLastMaintenance: string;
  scbaPsi: string;
  scbaMinutes: string;
  // Detector multigas fields
  detectorBrand: string;
  detectorGases: string;
  detectorLastMaintenance: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  phone: z.string().trim().min(10, "Ingresa un teléfono válido de 10 dígitos").max(15).regex(/^[\d\s\-+()]+$/, "Teléfono inválido"),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
});

type ContactData = z.infer<typeof contactSchema>;

const Mantenimiento = () => {
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [contact, setContact] = useState<ContactData>({ name: "", phone: "", email: "" });
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactData, string>>>({});
  const [step, setStep] = useState(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Equipment state
  const defaultEquipmentItem: EquipmentItem = { category: "", type: "", weight: "", quantity: 1, scbaLastMaintenance: "", scbaPsi: "", scbaMinutes: "", detectorBrand: "", detectorGases: "", detectorLastMaintenance: "" };
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([{ ...defaultEquipmentItem }]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  // Location cascade state
  const [selectedState, setSelectedState] = useState<MexicoState | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null);
  const [locationSubStep, setLocationSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const updateContact = (field: keyof ContactData, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    if (contactErrors[field]) setContactErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateEquipmentItem = (index: number, field: keyof EquipmentItem, value: string | number) => {
    setEquipmentItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    if (equipmentError) setEquipmentError(null);
  };

  const addEquipmentItem = () => {
    setEquipmentItems(prev => [...prev, { ...defaultEquipmentItem }]);
  };

  const removeEquipmentItem = (index: number) => {
    if (equipmentItems.length > 1) {
      setEquipmentItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const result = contactSchema.safeParse(contact);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactData, string>> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof ContactData;
        if (!fieldErrors[field]) fieldErrors[field] = e.message;
      });
      setContactErrors(fieldErrors);
      setStep(1);
      toast.error("Por favor completa todos los campos correctamente");
      return;
    }
    const hasValidEquipment = equipmentItems.some(item => {
      if (item.category === "extintores") return item.type && item.weight && item.quantity > 0;
      if (item.category === "scba") return item.scbaPsi && item.scbaMinutes && item.quantity > 0;
      if (item.category === "detector-multigas") return item.detectorBrand && item.quantity > 0;
      return false;
    });
    if (!hasValidEquipment) {
      setEquipmentError("Agrega al menos un equipo con todos los campos requeridos");
      setStep(1);
      return;
    }
    if (!date || !selectedTimeSlot) {
      toast.error("Selecciona una fecha y horario para la recolección");
      setStep(2);
      return;
    }
    if (!location) {
      toast.error("Fija tu ubicación en el mapa");
      return;
    }
    const slotLabel = TIME_SLOTS.find(s => s.id === selectedTimeSlot)?.label || "";
    const totalUnits = equipmentItems.reduce((sum, item) => sum + item.quantity, 0);
    toast.success(`¡Solicitud enviada! ${totalUnits} equipo(s) programados para recolección el ${format(date, "d 'de' MMMM", { locale: es })} de ${slotLabel}.`);
  };

  const hasValidEquipment = equipmentItems.some(item => {
    if (item.category === "extintores") return item.type && item.weight && item.quantity > 0;
    if (item.category === "scba") return item.scbaPsi && item.scbaMinutes && item.quantity > 0;
    if (item.category === "detector-multigas") return item.detectorBrand && item.quantity > 0;
    return false;
  });
  const isStep1Complete = contact.name.length >= 2 && contact.phone.length >= 10 && contact.email.includes("@") && hasValidEquipment;

  // Calculate slot availability when date changes
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

  const handleSelectState = (state: MexicoState) => {
    setSelectedState(state);
    setSelectedMunicipality(null);
    setSelectedPostalCode(null);
    setLocation(null);
    setLocationSubStep(2);
  };

  const handleSelectMunicipality = (muni: Municipality) => {
    setSelectedMunicipality(muni);
    setSelectedPostalCode(null);
    setLocation(null);
    setLocationSubStep(3);
  };

  const handleSelectPostalCode = (cp: string) => {
    setSelectedPostalCode(cp);
    setLocation(null);
    setLocationSubStep(4);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Agendar Mantenimiento
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Programa la recolección de tus extintores y equipo de seguridad para mantenimiento o recarga.
          </p>
        </div>

        {/* Progress steps */}
        <div className="mx-auto mb-10 flex max-w-2xl items-center justify-center gap-2 animate-slide-up" style={{ animationDelay: "50ms" }}>
          {[
            { n: 1, label: "Datos" },
            { n: 2, label: "Fecha" },
            { n: 3, label: "Ubicación" },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => setStep(n)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
                step === n
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : n < step || (n === 1 && isStep1Complete) || (n === 2 && isStep2Complete)
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {(n < step || (n === 1 && isStep1Complete) || (n === 2 && isStep2Complete)) && n !== step ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs">{n}</span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-2xl">
          {/* Step 1: Contact form */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <h2 className="text-xl font-bold">Datos de contacto</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre completo
                  </Label>
                  <Input
                    id="name"
                    value={contact.name}
                    onChange={(e) => updateContact("name", e.target.value)}
                    placeholder="Juan Pérez"
                    maxLength={100}
                    className={cn(contactErrors.name && "border-destructive")}
                  />
                  {contactErrors.name && <p className="text-xs text-destructive">{contactErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={contact.phone}
                    onChange={(e) => updateContact("phone", e.target.value)}
                    placeholder="55 1234 5678"
                    maxLength={15}
                    className={cn(contactErrors.phone && "border-destructive")}
                  />
                  {contactErrors.phone && <p className="text-xs text-destructive">{contactErrors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  maxLength={255}
                  className={cn(contactErrors.email && "border-destructive")}
                />
                {contactErrors.email && <p className="text-xs text-destructive">{contactErrors.email}</p>}
              </div>

              {/* Equipment questionnaire */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Flame className="h-5 w-5 text-primary" /> Equipo a recolectar
                  </h2>
                  <span className="text-xs text-muted-foreground">{equipmentItems.length} equipo(s)</span>
                </div>

                {equipmentError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {equipmentError}
                  </p>
                )}

                <div className="space-y-4">
                  {equipmentItems.map((item, index) => (
                    <div key={index} className="rounded-xl border border-border bg-muted/30 p-4 space-y-4 relative">
                      {equipmentItems.length > 1 && (
                        <button
                          onClick={() => removeEquipmentItem(index)}
                          className="absolute top-3 right-3 h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Equipo {index + 1}
                      </span>

                      {/* Categoría del equipo */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de equipo</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {EQUIPMENT_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => updateEquipmentItem(index, "category", cat.id)}
                              className={cn(
                                "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                                item.category === cat.id
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                              )}
                            >
                              <span className="flex items-center gap-1.5 text-sm font-medium">
                                <span>{cat.icon}</span>
                                {cat.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground leading-tight pl-5">{cat.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* === EXTINTORES fields === */}
                      {item.category === "extintores" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Tipo de extintor</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {EXTINGUISHER_TYPES.map((type) => (
                                <button
                                  key={type.id}
                                  onClick={() => updateEquipmentItem(index, "type", type.id)}
                                  className={cn(
                                    "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                                    item.type === type.id
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                  )}
                                >
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
                                <button
                                  key={w}
                                  onClick={() => updateEquipmentItem(index, "weight", w)}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                    item.weight === w
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                  )}
                                >
                                  {w}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* === SCBA fields === */}
                      {item.category === "scba" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Fecha de último mantenimiento</Label>
                            <Input
                              type="date"
                              value={item.scbaLastMaintenance}
                              onChange={(e) => updateEquipmentItem(index, "scbaLastMaintenance", e.target.value)}
                              className="max-w-[220px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Capacidad PSI</Label>
                            <div className="flex flex-wrap gap-2">
                              {SCBA_PSI_OPTIONS.map((psi) => (
                                <button
                                  key={psi}
                                  onClick={() => updateEquipmentItem(index, "scbaPsi", psi)}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                    item.scbaPsi === psi
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                  )}
                                >
                                  {psi}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Capacidad en Minutos</Label>
                            <div className="flex flex-wrap gap-2">
                              {SCBA_MINUTES_OPTIONS.map((min) => (
                                <button
                                  key={min}
                                  onClick={() => updateEquipmentItem(index, "scbaMinutes", min)}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                    item.scbaMinutes === min
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                                  )}
                                >
                                  {min}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* === DETECTOR MULTIGAS fields === */}
                      {item.category === "detector-multigas" && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Marca del detector</Label>
                            <Input
                              value={item.detectorBrand}
                              onChange={(e) => updateEquipmentItem(index, "detectorBrand", e.target.value)}
                              placeholder="Ej: Honeywell, MSA, Dräger, Industrial Scientific..."
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Capacidad de gases a detectar</Label>
                            <Input
                              value={item.detectorGases}
                              onChange={(e) => updateEquipmentItem(index, "detectorGases", e.target.value)}
                              placeholder="Ej: O₂, CO, H₂S, LEL (4 gases)"
                              maxLength={200}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Fecha de último mantenimiento</Label>
                            <Input
                              type="date"
                              value={item.detectorLastMaintenance}
                              onChange={(e) => updateEquipmentItem(index, "detectorLastMaintenance", e.target.value)}
                              className="max-w-[220px]"
                            />
                          </div>
                        </>
                      )}

                      {/* Cantidad - siempre visible cuando hay categoría */}
                      {item.category && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Cantidad</Label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateEquipmentItem(index, "quantity", Math.max(1, item.quantity - 1))}
                              className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[2rem] text-center text-lg font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateEquipmentItem(index, "quantity", Math.min(50, item.quantity + 1))}
                              className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-xs text-muted-foreground">unidades</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEquipmentItem}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar otro equipo
                </Button>

                {/* Notas adicionales */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" /> Notas adicionales (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Ej: Algunos extintores tienen daño en la manguera, necesito factura..."
                    maxLength={500}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground text-right">{additionalNotes.length}/500</p>
                </div>
              </div>

              <Button className="w-full transition-transform hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                const result = contactSchema.safeParse(contact);
                if (!result.success) {
                  const fieldErrors: Partial<Record<keyof ContactData, string>> = {};
                  result.error.errors.forEach((e) => {
                    const field = e.path[0] as keyof ContactData;
                    if (!fieldErrors[field]) fieldErrors[field] = e.message;
                  });
                  setContactErrors(fieldErrors);
                  return;
                }
                if (!hasValidEquipment) {
                  setEquipmentError("Completa los campos requeridos de al menos un equipo");
                  return;
                }
                setContactErrors({});
                setEquipmentError(null);
                setStep(2);
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
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setSelectedTimeSlot(null); }}
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>
              {date && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                    <CheckCircle className="h-4 w-4" />
                    {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </div>

                  {/* Time slot selector */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Horarios disponibles
                    </h3>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Disponible
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Último lugar
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" /> Sin disponibilidad
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const info = slotAvailabilities[slot.id];
                        if (!info) return null;
                        const isSelected = selectedTimeSlot === slot.id;
                        const isUnavailable = info.availability === "unavailable";
                        const isLimited = info.availability === "limited";

                        return (
                          <button
                            key={slot.id}
                            disabled={isUnavailable}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                            className={cn(
                              "relative flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-300",
                              isUnavailable
                                ? "border-border/50 bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                                : isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                                  : isLimited
                                    ? "border-amber-400/50 bg-amber-50 text-amber-800 hover:border-amber-500 hover:scale-[1.02] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700"
                                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02]"
                            )}
                          >
                            <span className="font-semibold">{slot.label}</span>
                            <span className={cn(
                              "text-[10px] font-normal",
                              isSelected ? "text-primary-foreground/80" : isUnavailable ? "text-muted-foreground" : isLimited ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                            )}>
                              {isUnavailable ? (
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Ocupado
                                </span>
                              ) : isLimited ? (
                                "¡Último lugar!"
                              ) : (
                                `${info.remaining} de ${info.total} disponibles`
                              )}
                            </span>
                            <span className={cn(
                              "absolute top-2 right-2 h-2 w-2 rounded-full",
                              isUnavailable ? "bg-destructive/60" : isLimited ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                            )} />
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

                    <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3 text-xs text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                        <span>
                          Los horarios reflejan nuestra disponibilidad real. Un horario marcado como <strong>"Ocupado"</strong> significa que ya tenemos recolecciones en curso y <strong>no podemos garantizar</strong> llegar a tiempo. Preferimos ser honestos contigo.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  ← Datos
                </Button>
                <Button
                  className="flex-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => {
                    if (!date) { toast.error("Selecciona una fecha"); return; }
                    if (!selectedTimeSlot) { toast.error("Selecciona un horario disponible"); return; }
                    setStep(3);
                  }}
                >
                  Siguiente → Ubicación
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Cascading Location Selector */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Ubicación de recolección
              </h2>

              {/* Breadcrumb trail */}
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <button
                  onClick={() => { setLocationSubStep(1); setSelectedState(null); setSelectedMunicipality(null); setSelectedPostalCode(null); setLocation(null); }}
                  className={cn("rounded-md px-2 py-1 transition-colors", locationSubStep === 1 ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted")}
                >
                  Estado
                </button>
                {selectedState && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <button
                      onClick={() => { setLocationSubStep(2); setSelectedMunicipality(null); setSelectedPostalCode(null); setLocation(null); }}
                      className={cn("rounded-md px-2 py-1 transition-colors", locationSubStep === 2 ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted")}
                    >
                      {selectedState.name}
                    </button>
                  </>
                )}
                {selectedMunicipality && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <button
                      onClick={() => { setLocationSubStep(3); setSelectedPostalCode(null); setLocation(null); }}
                      className={cn("rounded-md px-2 py-1 transition-colors", locationSubStep === 3 ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted")}
                    >
                      {selectedMunicipality.name}
                    </button>
                  </>
                )}
                {selectedPostalCode && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className={cn("rounded-md px-2 py-1", locationSubStep === 4 ? "bg-primary text-primary-foreground font-semibold" : "")}>
                      CP {selectedPostalCode}
                    </span>
                  </>
                )}
              </div>

              {/* Sub-step 1: Estado */}
              {locationSubStep === 1 && (
                <div className="animate-fade-in">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Selecciona tu estado</p>
                  <div className="space-y-1 rounded-xl border border-border overflow-hidden">
                    {mexicoStates.map((state, i) => (
                      <button
                        key={state.name}
                        onClick={() => handleSelectState(state)}
                        onMouseEnter={() => setHoveredItem(state.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-300 group",
                          hoveredItem === state.name
                            ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground scale-[1.01]"
                            : "bg-card text-foreground hover:bg-muted/50",
                          i < mexicoStates.length - 1 && "border-b border-border/50"
                        )}
                        style={{
                          animationDelay: `${i * 30}ms`,
                          animation: "fadeInUp 0.3s ease forwards",
                          opacity: 0,
                        }}
                      >
                        <span className={cn(
                          "h-2.5 w-2.5 rounded-full transition-all duration-300 shrink-0",
                          hoveredItem === state.name ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-primary/40"
                        )} />
                        <span className="flex-1">{state.name}</span>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-all duration-300",
                          hoveredItem === state.name ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-step 2: Municipio */}
              {locationSubStep === 2 && selectedState && (
                <div className="animate-fade-in">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Municipio en {selectedState.name}</p>
                  <div className="space-y-1 rounded-xl border border-border overflow-hidden">
                    {selectedState.municipalities.map((muni, i) => (
                      <button
                        key={muni.name}
                        onClick={() => handleSelectMunicipality(muni)}
                        onMouseEnter={() => setHoveredItem(muni.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all duration-300",
                          hoveredItem === muni.name
                            ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground scale-[1.01]"
                            : "bg-card text-foreground hover:bg-muted/50",
                          i < selectedState.municipalities.length - 1 && "border-b border-border/50"
                        )}
                        style={{
                          animationDelay: `${i * 30}ms`,
                          animation: "fadeInUp 0.3s ease forwards",
                          opacity: 0,
                        }}
                      >
                        <span className={cn(
                          "h-2.5 w-2.5 rounded-full transition-all duration-300 shrink-0",
                          hoveredItem === muni.name ? "bg-primary scale-125 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-primary/40"
                        )} />
                        <span className="flex-1">{muni.name}</span>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-all duration-300",
                          hoveredItem === muni.name ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-step 3: Código Postal */}
              {locationSubStep === 3 && selectedMunicipality && (
                <div className="animate-fade-in">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Código postal en {selectedMunicipality.name}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedMunicipality.postalCodes.map((cp, i) => (
                      <button
                        key={cp}
                        onClick={() => handleSelectPostalCode(cp)}
                        onMouseEnter={() => setHoveredItem(cp)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                          hoveredItem === cp
                            ? "border-primary bg-primary/10 text-primary scale-105 shadow-lg shadow-primary/10"
                            : "border-border bg-card text-foreground hover:border-primary/30"
                        )}
                        style={{
                          animationDelay: `${i * 50}ms`,
                          animation: "fadeInUp 0.3s ease forwards",
                          opacity: 0,
                        }}
                      >
                        {cp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-step 4: Map for precise pin */}
              {locationSubStep === 4 && selectedState && (
                <div className="animate-fade-in space-y-4">
                  <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ubica tu dirección exacta en el mapa y haz clic para fijar tu ubicación
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedState.name} → {selectedMunicipality?.name} → CP {selectedPostalCode}
                    </p>
                  </div>
                  <LocationMap
                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                    defaultCenter={selectedState.coords}
                  />
                  {location && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary animate-fade-in">
                      <CheckCircle className="h-4 w-4" />
                      Ubicación fijada correctamente
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  ← Fecha
                </Button>
                <Button
                  size="lg"
                  className="flex-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={!isLocationComplete}
                  onClick={handleSubmit}
                >
                  <Wrench className="mr-2 h-5 w-5" />
                  Solicitar Recolección
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mantenimiento;
