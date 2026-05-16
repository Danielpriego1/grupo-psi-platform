
CREATE TABLE public.brand_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_partners_public_select" ON public.brand_partners
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "brand_partners_admin_all" ON public.brand_partners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_brand_partners_updated_at
  BEFORE UPDATE ON public.brand_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon_name text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_offerings_public_select" ON public.service_offerings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "service_offerings_admin_all" ON public.service_offerings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_service_offerings_updated_at
  BEFORE UPDATE ON public.service_offerings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.brand_partners (name, logo_url, is_active, sort_order) VALUES
  ('3M', NULL, true, 1),
  ('Honeywell', NULL, true, 2),
  ('Ansell', NULL, true, 3),
  ('DuPont', NULL, true, 4),
  ('MSA Safety', NULL, true, 5),
  ('Draeger', NULL, true, 6),
  ('Moldex', NULL, true, 7),
  ('Condor', NULL, true, 8);

INSERT INTO public.service_offerings (title, description, icon_name, is_active, sort_order) VALUES
  ('Recarga de Extintores', 'Servicio certificado de recarga con agentes extinguidores de calidad', 'flame', true, 1),
  ('Mantenimiento Preventivo', 'Revisión periódica y mantenimiento de equipos contra incendio', 'wrench', true, 2),
  ('Certificación NOM', 'Certificación y verificación bajo normas NOM vigentes', 'shield', true, 3),
  ('EPP Certificado', 'Suministro de equipo de protección personal certificado', 'hard-hat', true, 4),
  ('Capacitación', 'Cursos y talleres de seguridad industrial para tu equipo', 'graduation-cap', true, 5),
  ('Auditoría de Seguridad', 'Evaluación completa de riesgos y cumplimiento normativo', 'clipboard-check', true, 6);

ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_offerings;
ALTER TABLE public.brand_partners REPLICA IDENTITY FULL;
ALTER TABLE public.service_offerings REPLICA IDENTITY FULL;
