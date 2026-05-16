import { useMemo, useState } from "react";
import {
  addDays, addMonths, addWeeks, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths, subWeeks,
} from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  useCalendarEvents, applyFilters,
  type CalendarEvent, type CalendarFilters as Filters,
} from "@/hooks/useCalendarEvents";
import { CalendarHeader, type CalendarView } from "@/components/admin/calendar/CalendarHeader";
import { CalendarFilters } from "@/components/admin/calendar/CalendarFilters";
import { MonthView } from "@/components/admin/calendar/MonthView";
import { TimeGrid } from "@/components/admin/calendar/TimeGrid";
import { EventDetailSheet } from "@/components/admin/calendar/EventDetailSheet";
import { AppointmentFormDialog } from "@/components/admin/calendar/AppointmentFormDialog";

export default function AdminCalendar() {
  const { roles } = useAuth();
  const canEdit = roles.includes("admin") || roles.includes("vendor");

  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<Filters>({
    sources: new Set(), statuses: new Set(), clientId: null, assignedTo: null,
  });

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === "month") {
      return {
        rangeStart: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      };
    }
    if (view === "week") {
      return {
        rangeStart: startOfWeek(cursor, { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(cursor, { weekStartsOn: 1 }),
      };
    }
    return { rangeStart: startOfDay(cursor), rangeEnd: endOfDay(cursor) };
  }, [view, cursor]);

  const { events } = useCalendarEvents(rangeStart, rangeEnd);
  const filtered = useMemo(() => applyFilters(events, filters), [events, filters]);

  const navigate = (dir: 1 | -1) => {
    if (view === "month") setCursor(dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    else if (view === "week") setCursor(dir === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1));
    else setCursor(addDays(cursor, dir));
  };

  return (
    <div className="space-y-4">
      <CalendarHeader
        cursor={cursor} view={view}
        onPrev={() => navigate(-1)} onNext={() => navigate(1)}
        onToday={() => setCursor(new Date())}
        onViewChange={setView}
        onNew={() => { setEditing(null); setInitialDate(cursor); setFormOpen(true); }}
        canCreate={canEdit}
      />

      <CalendarFilters filters={filters} setFilters={setFilters} />

      {view === "month" && (
        <MonthView
          cursor={cursor}
          events={filtered}
          onSelectEvent={setSelected}
          onSelectDate={(d) => { if (canEdit) { setInitialDate(d); setEditing(null); setFormOpen(true); } }}
        />
      )}
      {view !== "month" && (
        <TimeGrid cursor={cursor} events={filtered} onSelectEvent={setSelected} mode={view} />
      )}

      <EventDetailSheet
        event={selected}
        onClose={() => setSelected(null)}
        canEdit={canEdit}
        onEdit={(e) => { setSelected(null); setEditing(e); setFormOpen(true); }}
      />

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialDate={initialDate}
        editing={editing}
      />
    </div>
  );
}
