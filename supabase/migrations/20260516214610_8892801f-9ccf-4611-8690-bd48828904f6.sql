DROP POLICY IF EXISTS "Clients view own maintenance" ON public.maintenance_requests;

CREATE POLICY "Clients view own maintenance"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  contact_email IS NOT NULL
  AND lower(contact_email) = lower(coalesce(((auth.jwt() ->> 'email')), ''))
);