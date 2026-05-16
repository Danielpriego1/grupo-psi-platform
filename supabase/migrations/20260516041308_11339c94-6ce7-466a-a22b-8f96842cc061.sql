
-- Enums
CREATE TYPE public.equipment_type AS ENUM ('scba', 'cilindro', 'compresor', 'mascara', 'otro');
CREATE TYPE public.certificate_service_type AS ENUM ('mantenimiento', 'calibracion', 'hidrostatica', 'pureza_aire', 'posichek');
CREATE TYPE public.certificate_status AS ENUM ('vigente', 'por_vencer', 'vencido', 'revocado');
CREATE TYPE public.certificate_copy_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Equipment
CREATE TABLE public.equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  equipment_type public.equipment_type NOT NULL DEFAULT 'otro',
  serial_number text,
  brand text,
  model text,
  branch_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_equipment_client ON public.equipment(client_id);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and vendors manage equipment" ON public.equipment
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'vendor'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'vendor'::app_role));
CREATE POLICY "Authenticated can view equipment" ON public.equipment
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_equipment_updated_at BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Certificates
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio text NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  service_type public.certificate_service_type NOT NULL,
  branch_name text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  pdf_url text,
  qr_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status public.certificate_status NOT NULL DEFAULT 'vigente',
  issued_by uuid,
  source_request_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_certificates_client ON public.certificates(client_id);
CREATE INDEX idx_certificates_equipment ON public.certificates(equipment_id);
CREATE INDEX idx_certificates_status ON public.certificates(status);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage certificates" ON public.certificates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated view certificates" ON public.certificates
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Folio generator
CREATE OR REPLACE FUNCTION public.generate_certificate_folio(_service_type public.certificate_service_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prefix text;
  yr text;
  candidate text;
  cnt int;
BEGIN
  prefix := CASE _service_type
    WHEN 'mantenimiento' THEN 'MNT'
    WHEN 'calibracion' THEN 'CAL'
    WHEN 'hidrostatica' THEN 'HID'
    WHEN 'pureza_aire' THEN 'AIR'
    WHEN 'posichek' THEN 'POS'
  END;
  yr := to_char(now(), 'YYYY');
  LOOP
    candidate := 'PSI-' || prefix || '-' || yr || '-' || lpad((floor(random()*99999)+1)::text, 5, '0');
    SELECT count(*) INTO cnt FROM public.certificates WHERE folio = candidate;
    EXIT WHEN cnt = 0;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_certificate_folio()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := public.generate_certificate_folio(NEW.service_type);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_certificates_set_folio BEFORE INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_certificate_folio();

-- Public QR verification
CREATE OR REPLACE FUNCTION public.get_certificate_by_qr(_token uuid)
RETURNS TABLE(
  folio text,
  service_type public.certificate_service_type,
  branch_name text,
  issued_at date,
  valid_until date,
  status public.certificate_status,
  client_company text,
  equipment_serial text,
  equipment_brand text,
  equipment_model text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.folio, c.service_type, c.branch_name, c.issued_at, c.valid_until, c.status,
         cl.company_name, e.serial_number, e.brand, e.model
  FROM public.certificates c
  LEFT JOIN public.clients cl ON cl.id = c.client_id
  LEFT JOIN public.equipment e ON e.id = c.equipment_id
  WHERE c.qr_token = _token
  LIMIT 1;
$$;

-- Copy requests
CREATE TABLE public.certificate_copy_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id uuid NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  requested_by uuid,
  stripe_session_id text,
  amount_mxn numeric NOT NULL DEFAULT 250,
  payment_status public.certificate_copy_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  download_token uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_copy_requests_cert ON public.certificate_copy_requests(certificate_id);
CREATE INDEX idx_copy_requests_token ON public.certificate_copy_requests(download_token);
ALTER TABLE public.certificate_copy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage copy requests" ON public.certificate_copy_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users view own copy requests" ON public.certificate_copy_requests
  FOR SELECT TO authenticated USING (requested_by = auth.uid());
CREATE POLICY "Users create own copy requests" ON public.certificate_copy_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());

CREATE TRIGGER trg_copy_requests_updated_at BEFORE UPDATE ON public.certificate_copy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.certificates REPLICA IDENTITY FULL;
ALTER TABLE public.certificate_copy_requests REPLICA IDENTITY FULL;
ALTER TABLE public.equipment REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificate_copy_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins manage certificate files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'certificates' AND has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (bucket_id = 'certificates' AND has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Authenticated read certificate files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates');
