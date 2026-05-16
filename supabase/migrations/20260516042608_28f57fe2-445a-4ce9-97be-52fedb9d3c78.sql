
-- Add user_id to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email_lower ON public.clients(lower(email));

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $func$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::public.app_role)
  ON CONFLICT DO NOTHING;

  UPDATE public.clients
     SET user_id = NEW.id
   WHERE user_id IS NULL
     AND email IS NOT NULL
     AND lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper
CREATE OR REPLACE FUNCTION public.user_owns_client(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = _client_id
      AND (
        c.user_id = auth.uid()
        OR (c.email IS NOT NULL
            AND lower(c.email) = lower(coalesce((SELECT email FROM auth.users WHERE id = auth.uid()), '')))
      )
  )
$func$;
REVOKE EXECUTE ON FUNCTION public.user_owns_client(uuid) FROM anon;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- clients
DROP POLICY IF EXISTS "Admins and vendors can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "clients_admin_vendor_all" ON public.clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "clients_self_select" ON public.clients FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (email IS NOT NULL AND lower(email) = lower(coalesce((SELECT email FROM auth.users WHERE id = auth.uid()), ''))));
CREATE POLICY "clients_tecnico_select" ON public.clients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tecnico'));

-- equipment
DROP POLICY IF EXISTS "Admins and vendors manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated can view equipment" ON public.equipment;
CREATE POLICY "equipment_admin_vendor_all" ON public.equipment FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "equipment_tecnico_select" ON public.equipment FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tecnico'));
CREATE POLICY "equipment_client_select" ON public.equipment FOR SELECT TO authenticated
  USING (public.user_owns_client(client_id));

-- orders
DROP POLICY IF EXISTS "Admins and vendors can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
CREATE POLICY "orders_admin_vendor_all" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "orders_tecnico_assigned" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tecnico') AND assigned_to = auth.uid());
CREATE POLICY "orders_client_select" ON public.orders FOR SELECT TO authenticated
  USING (client_id IS NOT NULL AND public.user_owns_client(client_id));

-- order_items
DROP POLICY IF EXISTS "Admins and vendors can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;
CREATE POLICY "order_items_admin_vendor_all" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "order_items_related_select" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
    AND ((public.has_role(auth.uid(), 'tecnico') AND o.assigned_to = auth.uid())
         OR (o.client_id IS NOT NULL AND public.user_owns_client(o.client_id)))));

-- appointments
DROP POLICY IF EXISTS "Admins and vendors can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
CREATE POLICY "appointments_admin_vendor_all" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "appointments_tecnico_assigned" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tecnico') AND assigned_to = auth.uid());
CREATE POLICY "appointments_tecnico_update" ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'tecnico') AND assigned_to = auth.uid());
CREATE POLICY "appointments_client_select" ON public.appointments FOR SELECT TO authenticated
  USING (client_id IS NOT NULL AND public.user_owns_client(client_id));

-- deliveries
DROP POLICY IF EXISTS "Admins can manage deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Authenticated users can view deliveries" ON public.deliveries;
CREATE POLICY "deliveries_admin_all" ON public.deliveries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deliveries_related_select" ON public.deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = deliveries.order_id
    AND ((public.has_role(auth.uid(), 'tecnico') AND o.assigned_to = auth.uid())
         OR (o.client_id IS NOT NULL AND public.user_owns_client(o.client_id)))));

-- certificates
DROP POLICY IF EXISTS "Admins manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Authenticated view certificates" ON public.certificates;
CREATE POLICY "certificates_admin_all" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "certificates_tecnico_select" ON public.certificates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'tecnico'));
CREATE POLICY "certificates_client_select" ON public.certificates FOR SELECT TO authenticated
  USING (public.user_owns_client(client_id));

-- maintenance_requests (keep public insert + admin; add client self-view by email)
DROP POLICY IF EXISTS "Clients view own maintenance" ON public.maintenance_requests;
CREATE POLICY "Clients view own maintenance" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (contact_email IS NOT NULL AND lower(contact_email) = lower(coalesce((SELECT email FROM auth.users WHERE id = auth.uid()), '')));
