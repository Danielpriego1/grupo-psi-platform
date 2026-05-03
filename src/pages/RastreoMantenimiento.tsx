import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CalendarDays, Clock, MapPin, Package, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type TrackingResult = {
  tracking_code: string;
  status: string;
  contact_name: string;
  scheduled_date: string | null;
  time_slot: string | null;
  total_units: number;
  state: string | null;
  municipality: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  pending: { label: "Pendiente", variant: "secondary", description: "Recibimos tu solicitud y la estamos revisando." },
  confirmed: { label: "Confirmada", variant: "default", description: "Tu solicitud fue confirmada y agendada." },
  in_progress: { label: "En proceso", variant: "default", description: "Nuestro equipo está atendiendo tu solicitud." },
  completed: { label: "Completada", variant: "default", description: "El servicio fue completado satisfactoriamente." },
  cancelled: { label: "Cancelada", variant: "destructive", description: "Esta solicitud fue cancelada." },
};

export default function RastreoMantenimiento() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = async (lookupCode: string) => {
    const trimmed = lookupCode.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const { data, error } = await supabase.rpc("get_maintenance_by_tracking_code", { _code: trimmed });
    setLoading(false);
    if (error) {
      toast.error("Error al consultar la solicitud");
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setNotFound(true);
      return;
    }
    setResult(row as TrackingResult);
  };

  useEffect(() => {
    const initial = params.get("code");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ code: code.trim().toUpperCase() });
    lookup(code);
  };

  const status = result ? STATUS_LABELS[result.status] ?? STATUS_LABELS.pending : null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl mb-2">
            Rastrea tu solicitud
          </h1>
          <p className="text-muted-foreground">
            Ingresa el código que recibiste al agendar tu servicio de mantenimiento.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Código de rastreo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="code" className="sr-only">Código</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="MNT-XXXXXX"
                  className="font-mono tracking-wider uppercase"
                />
              </div>
              <Button type="submit" disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="mt-6 border-destructive/40">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No encontramos ninguna solicitud con ese código.</p>
                <p className="text-sm text-muted-foreground">Verifica que esté escrito correctamente (formato MNT-XXXXXX).</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && status && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Código</p>
                  <p className="font-mono text-lg font-bold">{result.tracking_code}</p>
                </div>
                <Badge variant={status.variant} className="text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">{status.description}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p className="font-medium">{result.contact_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Equipos</p>
                    <p className="font-medium">{result.total_units} unidad(es)</p>
                  </div>
                </div>
                {result.scheduled_date && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha programada</p>
                      <p className="font-medium">
                        {format(new Date(result.scheduled_date), "d 'de' MMMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {result.time_slot && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horario</p>
                      <p className="font-medium">{result.time_slot}</p>
                    </div>
                  </div>
                )}
                {(result.municipality || result.state) && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ubicación</p>
                      <p className="font-medium">
                        {[result.municipality, result.state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground border-t border-border pt-3">
                Solicitada el {format(new Date(result.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })} ·
                Última actualización {format(new Date(result.updated_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
