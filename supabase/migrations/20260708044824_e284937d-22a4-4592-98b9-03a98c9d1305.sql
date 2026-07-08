
CREATE TABLE public.notification_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  body text,
  url text,
  tag text,
  ref_number text,
  sent integer NOT NULL DEFAULT 0,
  removed integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  total_targets integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification events"
  ON public.notification_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can update notification events"
  ON public.notification_events FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can delete notification events"
  ON public.notification_events FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE INDEX notification_events_created_at_idx
  ON public.notification_events (created_at DESC);
CREATE INDEX notification_events_kind_idx
  ON public.notification_events (kind);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_events;
