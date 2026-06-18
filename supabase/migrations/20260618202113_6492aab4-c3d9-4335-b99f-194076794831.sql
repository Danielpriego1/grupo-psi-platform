
-- ============= ENUMS =============
CREATE TYPE public.crm_stage AS ENUM ('nuevo','diagnostico','cotizado','negociacion','ganado','perdido');
CREATE TYPE public.crm_source AS ENUM ('chat_sora','cotizacion','mantenimiento','manual','web');
CREATE TYPE public.crm_urgency AS ENUM ('baja','media','alta','critica');
CREATE TYPE public.crm_task_status AS ENUM ('pendiente','completada','vencida','cancelada');
CREATE TYPE public.crm_activity_type AS ENUM ('nota','llamada','email','whatsapp','visita','sora_msg','escalamiento','cambio_etapa','tarea');

-- ============= OPPORTUNITIES =============
CREATE TABLE public.crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name text,
  contact_phone text,
  contact_email text,
  stage public.crm_stage NOT NULL DEFAULT 'nuevo',
  source public.crm_source NOT NULL DEFAULT 'manual',
  source_ref text,
  priority_line text,
  estimated_value numeric(12,2) DEFAULT 0,
  urgency public.crm_urgency NOT NULL DEFAULT 'media',
  risk_notes text,
  normativa text,
  diagnostic_summary text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_sora boolean NOT NULL DEFAULT false,
  needs_human_escalation boolean NOT NULL DEFAULT false,
  escalation_reason text,
  won_amount numeric(12,2),
  lost_reason text,
  closed_at timestamptz,
  next_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_opps_stage ON public.crm_opportunities(stage);
CREATE INDEX idx_crm_opps_assigned ON public.crm_opportunities(assigned_to);
CREATE INDEX idx_crm_opps_client ON public.crm_opportunities(client_id);
CREATE INDEX idx_crm_opps_escalation ON public.crm_opportunities(needs_human_escalation) WHERE needs_human_escalation;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_opportunities TO authenticated;
GRANT ALL ON public.crm_opportunities TO service_role;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve todas las oportunidades" ON public.crm_opportunities
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin gestiona oportunidades" ON public.crm_opportunities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Vendedor ve oportunidades propias o sin asignar" ON public.crm_opportunities
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'vendor'::public.app_role)
    AND (assigned_to = auth.uid() OR assigned_to IS NULL)
  );
CREATE POLICY "Vendedor edita sus oportunidades" ON public.crm_opportunities
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'vendor'::public.app_role) AND assigned_to = auth.uid()
  ) WITH CHECK (
    public.has_role(auth.uid(),'vendor'::public.app_role)
  );

CREATE TRIGGER trg_crm_opps_updated_at BEFORE UPDATE ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= TASKS =============
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_at timestamptz,
  status public.crm_task_status NOT NULL DEFAULT 'pendiente',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_tasks_status ON public.crm_tasks(status);
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_opp ON public.crm_tasks(opportunity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona tareas" ON public.crm_tasks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Vendedor ve sus tareas" ON public.crm_tasks
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'vendor'::public.app_role)
    AND (assigned_to = auth.uid() OR created_by = auth.uid())
  );
CREATE POLICY "Vendedor edita sus tareas" ON public.crm_tasks
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'vendor'::public.app_role) AND assigned_to = auth.uid()
  ) WITH CHECK (
    public.has_role(auth.uid(),'vendor'::public.app_role)
  );
CREATE POLICY "Vendedor crea tareas" ON public.crm_tasks
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'vendor'::public.app_role) AND created_by = auth.uid()
  );

CREATE TRIGGER trg_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= ACTIVITIES =============
CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  type public.crm_activity_type NOT NULL DEFAULT 'nota',
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_sora boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crm_act_opp ON public.crm_activities(opportunity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve actividades" ON public.crm_activities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Vendedor ve actividades de sus oportunidades" ON public.crm_activities
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'vendor'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.crm_opportunities o
      WHERE o.id = crm_activities.opportunity_id
        AND (o.assigned_to = auth.uid() OR o.assigned_to IS NULL)
    )
  );
CREATE POLICY "Vendedor crea actividades de sus oportunidades" ON public.crm_activities
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'vendor'::public.app_role)
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.crm_opportunities o
      WHERE o.id = opportunity_id AND o.assigned_to = auth.uid()
    )
  );

-- ============= TRIGGERS DE AUTO-CAPTURA =============
CREATE OR REPLACE FUNCTION public.crm_opp_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Solo crear oportunidad para cotizaciones COT- nuevas
  IF NEW.order_number IS NULL OR NEW.order_number NOT LIKE 'COT-%' THEN
    RETURN NEW;
  END IF;

  -- Buscar cliente por email
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE email IS NOT NULL AND lower(email) = lower(coalesce(NEW.contact_email,''))
  LIMIT 1;

  INSERT INTO public.crm_opportunities(
    title, client_id, contact_name, contact_phone, contact_email,
    stage, source, source_ref, estimated_value, urgency, priority_line,
    diagnostic_summary
  ) VALUES (
    'Cotización ' || NEW.order_number,
    v_client_id,
    NEW.contact_name, NEW.contact_phone, NEW.contact_email,
    'cotizado'::public.crm_stage,
    'cotizacion'::public.crm_source,
    NEW.order_number,
    coalesce(NEW.total, 0),
    'media'::public.crm_urgency,
    'Cotización web',
    'Cotización generada desde el carrito. Total: $' || coalesce(NEW.total,0)::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_from_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.crm_opp_from_order();

CREATE OR REPLACE FUNCTION public.crm_opp_from_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_line text;
BEGIN
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE email IS NOT NULL AND lower(email) = lower(coalesce(NEW.contact_email,''))
  LIMIT 1;

  v_line := CASE
    WHEN NEW.service_type ILIKE '%hidrostatica%' OR NEW.service_type ILIKE '%hidrost%' THEN 'Pruebas hidrostáticas'
    WHEN NEW.service_type ILIKE '%posichek%' THEN 'Pruebas PosiChek'
    WHEN NEW.service_type ILIKE '%pureza%' THEN 'Pruebas de pureza de aire'
    WHEN NEW.service_type ILIKE '%calibr%' THEN 'Calibraciones'
    WHEN NEW.service_type ILIKE '%certific%' THEN 'Certificaciones'
    WHEN NEW.equipment_type ILIKE '%scba%' THEN 'SCBA y equipos de escape rápido'
    WHEN NEW.equipment_type ILIKE '%detector%' THEN 'Detectores de gas portátiles y fijos'
    WHEN NEW.equipment_type ILIKE '%extintor%' THEN 'Extintores'
    ELSE coalesce(NEW.service_type, 'Mantenimiento')
  END;

  INSERT INTO public.crm_opportunities(
    title, client_id, contact_name, contact_phone, contact_email,
    stage, source, source_ref, priority_line, urgency,
    diagnostic_summary, estimated_value
  ) VALUES (
    'Mantenimiento ' || coalesce(NEW.folio, NEW.tracking_code, 'sin folio'),
    v_client_id,
    NEW.contact_name, NEW.contact_phone, NEW.contact_email,
    'diagnostico'::public.crm_stage,
    'mantenimiento'::public.crm_source,
    coalesce(NEW.folio, NEW.tracking_code),
    v_line,
    CASE WHEN coalesce(NEW.total_units,0) >= 20 THEN 'alta'::public.crm_urgency ELSE 'media'::public.crm_urgency END,
    'Solicitud de servicio: ' || coalesce(NEW.service_type,'mantenimiento') ||
    '. Equipos: ' || coalesce(NEW.total_units,0)::text ||
    '. Ubicación: ' || coalesce(NEW.municipality,'') || ', ' || coalesce(NEW.state,''),
    coalesce(NEW.total_units,0) * 350
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_from_maintenance
  AFTER INSERT ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.crm_opp_from_maintenance();

-- ============= MARCAR TAREAS VENCIDAS (helper) =============
CREATE OR REPLACE FUNCTION public.crm_mark_overdue_tasks()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.crm_tasks
  SET status = 'vencida'::public.crm_task_status, updated_at = now()
  WHERE status = 'pendiente'::public.crm_task_status
    AND due_at IS NOT NULL
    AND due_at < now();
$$;
