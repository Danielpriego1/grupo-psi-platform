CREATE OR REPLACE FUNCTION public.get_admin_recipient_emails()
RETURNS TABLE(email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT u.email
  FROM auth.users u
  JOIN public.user_roles r ON r.user_id = u.id
  WHERE r.role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    AND u.email IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_admin_recipient_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_recipient_emails() TO service_role;

DROP POLICY IF EXISTS "Admins can read admin-reports" ON storage.objects;
CREATE POLICY "Admins can read admin-reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'admin-reports'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'superadmin'::public.app_role))
  );