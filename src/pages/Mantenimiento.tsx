import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { LocationMap } from "@/components/LocationMap";
import { Wrench, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Mantenimiento = () => {
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSubmit = () => {
    if (!date) {
      toast.error("Selecciona una fecha para la recolección");
      return;
    }
    if (!location) {
      toast.error("Selecciona la ubicación en el mapa");
      return;
    }
    toast.success("¡Solicitud enviada! Nos pondremos en contacto contigo para confirmar la recolección.");
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
            Programa la recolección de tus extintores y equipo de seguridad para mantenimiento o recarga. Selecciona fecha y ubicación.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Calendar */}
            <div className="animate-slide-up space-y-4" style={{ animationDelay: "100ms" }}>
              <h2 className="text-xl font-bold">1. Selecciona la fecha</h2>
              <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-lg">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={es}
                  className={cn("p-3 pointer-events-auto w-full")}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
              {date && (
                <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary animate-fade-in">
                  <CheckCircle className="h-4 w-4" />
                  {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="animate-slide-up space-y-4" style={{ animationDelay: "200ms" }}>
              <h2 className="text-xl font-bold">2. Marca tu ubicación</h2>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                <LocationMap
                  onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                  className="p-4"
                />
              </div>
              {location && (
                <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary animate-fade-in">
                  <CheckCircle className="h-4 w-4" />
                  Ubicación seleccionada
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-10 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Button
              size="lg"
              className="px-12 text-base transition-transform hover:scale-105 active:scale-95"
              onClick={handleSubmit}
            >
              <Wrench className="mr-2 h-5 w-5" />
              Solicitar Recolección
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mantenimiento;
