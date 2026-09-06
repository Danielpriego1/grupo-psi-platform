CREATE OR REPLACE FUNCTION public.current_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_auth_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_auth_email() TO authenticated, service_role;

DROP POLICY IF EXISTS clients_self_select ON public.clients;

CREATE POLICY clients_self_select ON public.clients
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (email IS NOT NULL AND lower(email) = lower(coalesce(public.current_auth_email(), '')))
);