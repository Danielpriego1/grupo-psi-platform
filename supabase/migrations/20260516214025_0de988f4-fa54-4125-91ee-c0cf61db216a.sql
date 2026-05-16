
-- 1. Quitar listado público de buckets (los archivos siguen accesibles por URL directa)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "brand_logos_public_read" ON storage.objects;

-- 2. Reemplazar INSERT permisivo en maintenance_requests por validación mínima
DROP POLICY IF EXISTS "Anyone can create maintenance requests" ON public.maintenance_requests;

CREATE POLICY "Public can create maintenance requests with valid data"
  ON public.maintenance_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(contact_name)) > 1
    AND length(btrim(contact_phone)) >= 7
    AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(coalesce(additional_notes, '')) <= 5000
  );
