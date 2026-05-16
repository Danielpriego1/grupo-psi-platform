
-- Enums
CREATE TYPE public.appointment_type AS ENUM ('visit', 'inspection', 'pickup', 'meeting');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Tabla appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name text,
  contact_phone text,
  assigned_to uuid,
  appointment_type public.appointment_type NOT NULL DEFAULT 'visit',
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  address text,
  state text,
  municipality text,
  latitude double precision,
  longitude double precision,
  notes text,
  internal_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_assigned ON public.appointments(assigned_to);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and vendors can manage appointments"
ON public.appointments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'vendor'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'vendor'::app_role));

CREATE POLICY "Authenticated users can view appointments"
ON public.appointments FOR SELECT TO authenticated USING (true);

CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vista unificada calendar_events
CREATE OR REPLACE VIEW public.calendar_events
WITH (security_invoker = true) AS
-- Citas
SELECT
  a.id,
  'appointment'::text AS source,
  a.id AS source_id,
  COALESCE(NULLIF(a.contact_name, ''), c.company_name, 'Cita') AS title,
  a.appointment_type::text AS event_type,
  a.status::text AS status,
  a.scheduled_at AS start_at,
  (a.scheduled_at + (a.duration_minutes || ' minutes')::interval) AS end_at,
  COALESCE(c.company_name, a.contact_name) AS client_name,
  a.client_id,
  a.address,
  a.state,
  a.municipality,
  a.latitude,
  a.longitude,
  a.assigned_to,
  a.contact_phone,
  a.notes,
  a.internal_notes,
  a.created_at
FROM public.appointments a
LEFT JOIN public.clients c ON c.id = a.client_id

UNION ALL
-- Mantenimientos
SELECT
  m.id,
  'maintenance'::text,
  m.id,
  COALESCE('Mantenimiento — ' || m.contact_name, 'Mantenimiento') AS title,
  'maintenance'::text,
  m.status::text,
  (m.scheduled_date::timestamp
    + COALESCE(
        CASE
          WHEN m.time_slot ~ '^[0-2][0-9]:[0-5][0-9]' THEN substring(m.time_slot from 1 for 5)::time
          ELSE '09:00'::time
        END,
        '09:00'::time
      ))::timestamptz AS start_at,
  (m.scheduled_date::timestamp
    + COALESCE(
        CASE
          WHEN m.time_slot ~ '^[0-2][0-9]:[0-5][0-9]' THEN substring(m.time_slot from 1 for 5)::time
          ELSE '09:00'::time
        END,
        '09:00'::time
      ) + interval '2 hours')::timestamptz AS end_at,
  m.contact_name AS client_name,
  NULL::uuid AS client_id,
  m.address,
  m.state,
  m.municipality,
  m.latitude,
  m.longitude,
  NULL::uuid AS assigned_to,
  m.contact_phone,
  m.additional_notes AS notes,
  NULL::text AS internal_notes,
  m.created_at
FROM public.maintenance_requests m
WHERE m.scheduled_date IS NOT NULL

UNION ALL
-- Entregas
SELECT
  d.id,
  'delivery'::text,
  d.id,
  COALESCE('Entrega ' || o.order_number, 'Entrega') AS title,
  'delivery'::text,
  d.status::text,
  (d.scheduled_date::timestamp + interval '9 hours')::timestamptz AS start_at,
  (d.scheduled_date::timestamp + interval '10 hours')::timestamptz AS end_at,
  c.company_name AS client_name,
  o.client_id,
  COALESCE(d.delivery_address, o.address) AS address,
  o.state,
  o.municipality,
  o.latitude,
  o.longitude,
  o.assigned_to,
  NULL::text AS contact_phone,
  d.notes,
  NULL::text AS internal_notes,
  d.created_at
FROM public.deliveries d
LEFT JOIN public.orders o ON o.id = d.order_id
LEFT JOIN public.clients c ON c.id = o.client_id
WHERE d.scheduled_date IS NOT NULL

UNION ALL
-- Órdenes pendientes/confirmadas como hitos
SELECT
  o.id,
  'order'::text,
  o.id,
  COALESCE('Pedido ' || o.order_number, 'Pedido') AS title,
  'order'::text,
  o.status::text,
  o.created_at AS start_at,
  (o.created_at + interval '30 minutes') AS end_at,
  c.company_name AS client_name,
  o.client_id,
  o.address,
  o.state,
  o.municipality,
  o.latitude,
  o.longitude,
  o.assigned_to,
  NULL::text AS contact_phone,
  o.notes,
  NULL::text AS internal_notes,
  o.created_at
FROM public.orders o
LEFT JOIN public.clients c ON c.id = o.client_id
WHERE o.status IN ('pending'::order_status, 'confirmed'::order_status);

-- Realtime
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.maintenance_requests REPLICA IDENTITY FULL;
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
