import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays, Clock, MapPin, Phone, User, FileText, ExternalLink, Check, X, Edit,
} from "lucide-react";
import { SOURCE_META, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  canEdit: boolean;
  onEdit?: (e: CalendarEvent) => void;
}

const SOURCE_TABLE: Record<string, string> = {
  appointment: "appointments",
  maintenance: "maintenance_requests",
  delivery: "deliveries",
  order: "orders",
};

const SOURCE_LINK: Record<string, string> = {
  appointment: "/admin/calendario",
  maintenance: "/admin/maintenance",
  delivery: "/admin/deliveries",
  order: "/admin/orders",
};

export function EventDetailSheet({ event, onClose, canEdit, onEdit }: Props) {
  const { toast } = useToast();
  if (!event) return null;
  const meta = SOURCE_META[event.source];

  const updateStatus = async (status: string) => {
    const table = SOURCE_TABLE[event.source];
    const { error } = await supabase.from(table as any).update({ status }).eq("id", event.source_id);
    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estado actualizado", description: `Marcado como ${status}` });
      onClose();
    }
  };

  const mapsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : event.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
    : null;

  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
            <Badge variant="outline" className="text-[10px] font-normal">{meta.label}</Badge>
            <Badge variant="outline" className="text-[10px] font-normal capitalize">
              {event.status.replace("_", " ")}
            </Badge>
          </div>
          <SheetTitle className="text-lg leading-tight">{event.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-sm">
          <div className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-foreground">
                {format(new Date(event.start_at), "EEEE d 'de' LLLL, yyyy", { locale: es })}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {format(new Date(event.start_at), "HH:mm")} – {format(new Date(event.end_at), "HH:mm")}
              </div>
            </div>
          </div>

          {event.client_name && (
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-foreground">{event.client_name}</div>
                {event.contact_phone && (
                  <a href={`tel:${event.contact_phone}`} className="text-xs text-muted-foreground hover:text-foreground">
                    {event.contact_phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {(event.address || event.municipality) && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-foreground">{event.address || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {[event.municipality, event.state].filter(Boolean).join(", ")}
                </div>
                {mapsUrl && (
                  <a
                    href={mapsUrl} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver en Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {event.notes && (
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Notas</div>
                <p className="mt-0.5 whitespace-pre-line text-foreground">{event.notes}</p>
              </div>
            </div>
          )}

          {event.internal_notes && (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Notas internas</div>
              <p className="mt-0.5 whitespace-pre-line text-foreground">{event.internal_notes}</p>
            </div>
          )}
        </div>

        {canEdit && (
          <>
            <Separator className="my-6" />
            <div className="flex flex-wrap gap-2">
              {event.source === "appointment" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => updateStatus("confirmed")}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Confirmar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus("completed")}>
                    Completada
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus("cancelled")}>
                    <X className="mr-1 h-3.5 w-3.5" /> Cancelar
                  </Button>
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={() => onEdit(event)}>
                      <Edit className="mr-1 h-3.5 w-3.5" /> Editar
                    </Button>
                  )}
                </>
              )}
              <Link to={SOURCE_LINK[event.source]} onClick={onClose}>
                <Button size="sm" variant="ghost">
                  Abrir registro <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
