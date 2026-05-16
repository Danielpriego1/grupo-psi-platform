
-- Equipment QR token
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS qr_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_qr_token ON public.equipment(qr_token);

-- Public equipment verification RPC
CREATE OR REPLACE FUNCTION public.get_equipment_by_qr(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  eq record;
  cl record;
  last_cert record;
  last_maint record;
  next_appt record;
  certs jsonb;
  result jsonb;
  status text;
BEGIN
  SELECT * INTO eq FROM public.equipment WHERE qr_token = _token LIMIT 1;
  IF eq IS NULL THEN RETURN NULL; END IF;

  SELECT id, company_name INTO cl FROM public.clients WHERE id = eq.client_id LIMIT 1;

  SELECT folio, service_type, issued_at, valid_until, status, qr_token
    INTO last_cert
    FROM public.certificates
    WHERE equipment_id = eq.id
    ORDER BY issued_at DESC NULLS LAST LIMIT 1;

  SELECT contact_name, scheduled_date, time_slot, status, total_units
    INTO last_maint
    FROM public.maintenance_requests
    WHERE additional_notes ILIKE '%' || eq.id::text || '%'
       OR contact_name = cl.company_name
    ORDER BY created_at DESC LIMIT 1;

  SELECT scheduled_at, appointment_type, status
    INTO next_appt
    FROM public.appointments
    WHERE client_id = eq.client_id
      AND scheduled_at >= now()
    ORDER BY scheduled_at ASC LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'folio', c.folio,
           'service_type', c.service_type,
           'issued_at', c.issued_at,
           'valid_until', c.valid_until,
           'status', c.status,
           'qr_token', c.qr_token
         ) ORDER BY c.issued_at DESC), '[]'::jsonb)
    INTO certs
    FROM public.certificates c
    WHERE c.equipment_id = eq.id;

  status := CASE
    WHEN EXISTS (SELECT 1 FROM public.certificates WHERE equipment_id = eq.id AND status = 'vigente') THEN 'operativo'
    WHEN EXISTS (SELECT 1 FROM public.certificates WHERE equipment_id = eq.id AND status = 'por_vencer') THEN 'mantenimiento_proximo'
    WHEN EXISTS (SELECT 1 FROM public.certificates WHERE equipment_id = eq.id AND status = 'vencido') THEN 'fuera_servicio'
    ELSE 'sin_certificado'
  END;

  result := jsonb_build_object(
    'equipment', jsonb_build_object(
      'id', eq.id,
      'equipment_type', eq.equipment_type,
      'serial_number', eq.serial_number,
      'brand', eq.brand,
      'model', eq.model,
      'branch_name', eq.branch_name,
      'notes', eq.notes
    ),
    'client', CASE WHEN cl IS NULL THEN NULL ELSE jsonb_build_object('company_name', cl.company_name) END,
    'status', status,
    'last_certificate', CASE WHEN last_cert IS NULL THEN NULL ELSE to_jsonb(last_cert) END,
    'last_maintenance', CASE WHEN last_maint IS NULL THEN NULL ELSE to_jsonb(last_maint) END,
    'next_appointment', CASE WHEN next_appt IS NULL THEN NULL ELSE to_jsonb(next_appt) END,
    'certificates', certs
  );
  RETURN result;
END;
$$;

-- Admin: regenerate QR tokens
CREATE OR REPLACE FUNCTION public.regenerate_equipment_qr(_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_token uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  new_token := gen_random_uuid();
  UPDATE public.equipment SET qr_token = new_token, updated_at = now() WHERE id = _id;
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_certificate_qr(_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_token uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  new_token := gen_random_uuid();
  UPDATE public.certificates SET qr_token = new_token, updated_at = now() WHERE id = _id;
  RETURN new_token;
END;
$$;
