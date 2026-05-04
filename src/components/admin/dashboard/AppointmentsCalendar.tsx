import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  type: "maintenance" | "delivery";
}

export function AppointmentsCalendar({ events }: { events: CalendarEvent[] }) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Agenda — Mantenimientos y entregas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[480px] bg-card rounded-lg p-2">
          <Calendar
            localizer={localizer}
            events={events}
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
            culture="es"
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              noEventsInRange: "Sin eventos",
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.type === "maintenance" ? "#f97316" : "#3b82f6",
                border: "none",
                fontSize: 12,
              },
            })}
            style={{ height: "100%" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
