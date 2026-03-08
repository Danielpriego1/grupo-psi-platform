import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocationMap } from "@/components/LocationMap";
import { Wrench, CheckCircle, User, Phone, Mail, Package, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { mexicoStates, type MexicoState, type Municipality } from "@/data/mexicoLocations";

const formSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  phone: z.string().trim().min(10, "Ingresa un teléfono válido de 10 dígitos").max(15).regex(/^[\d\s\-+()]+$/, "Teléfono inválido"),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  equipmentDescription: z.string().trim().min(5, "Describe brevemente tu equipo").max(500),
});

type FormData = z.infer<typeof formSchema>;

const Mantenimiento = () => {
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", equipmentDescription: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [step, setStep] = useState(1);

  // Location cascade state
  const [selectedState, setSelectedState] = useState<MexicoState | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null);
  const [locationSubStep, setLocationSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = () => {
    const result = formSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof FormData;
        if (!fieldErrors[field]) fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      setStep(1);
      toast.error("Por favor completa todos los campos correctamente");
      return;
    }
    if (!date) {
      toast.error("Selecciona una fecha para la recolección");
      setStep(2);
      return;
    }
    if (!location) {
      toast.error("Fija tu ubicación en el mapa");
      return;
    }
    toast.success("¡Solicitud enviada! Nos pondremos en contacto contigo para confirmar la recolección.");
  };

  const isStep1Complete = form.name.length >= 2 && form.phone.length >= 10 && form.email.includes("@") && form.equipmentDescription.length >= 5;
  const isStep2Complete = !!date;
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
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Juan Pérez"
                    maxLength={100}
                    className={cn(errors.name && "border-destructive")}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="55 1234 5678"
                    maxLength={15}
                    className={cn(errors.phone && "border-destructive")}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  maxLength={255}
                  className={cn(errors.email && "border-destructive")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment" className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" /> Descripción del equipo
                </Label>
                <Textarea
                  id="equipment"
                  value={form.equipmentDescription}
                  onChange={(e) => updateField("equipmentDescription", e.target.value)}
                  placeholder="Ej: 3 extintores PQS de 4.5 kg que necesitan recarga..."
                  maxLength={500}
                  rows={3}
                  className={cn(errors.equipmentDescription && "border-destructive")}
                />
                {errors.equipmentDescription && <p className="text-xs text-destructive">{errors.equipmentDescription}</p>}
                <p className="text-xs text-muted-foreground text-right">{form.equipmentDescription.length}/500</p>
              </div>

              <Button className="w-full transition-transform hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                const result = formSchema.safeParse(form);
                if (!result.success) {
                  const fieldErrors: Partial<Record<keyof FormData, string>> = {};
                  result.error.errors.forEach((e) => {
                    const field = e.path[0] as keyof FormData;
                    if (!fieldErrors[field]) fieldErrors[field] = e.message;
                  });
                  setErrors(fieldErrors);
                  return;
                }
                setErrors({});
                setStep(2);
              }}>
                Siguiente → Seleccionar fecha
              </Button>
            </div>
          )}

          {/* Step 2: Calendar */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              <h2 className="text-xl font-bold">Selecciona la fecha de recolección</h2>
              <div className="flex justify-center">
                <div className="overflow-hidden rounded-xl border border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>
              {date && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary animate-fade-in">
                  <CheckCircle className="h-4 w-4" />
                  {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
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
