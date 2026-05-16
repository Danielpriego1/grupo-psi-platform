
CREATE TABLE public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE,
  event_type text NOT NULL,
  stripe_session_id text,
  stripe_payment_intent text,
  order_id uuid,
  order_number text,
  payment_status text,
  processing_status text NOT NULL DEFAULT 'received',
  ticket_generated boolean NOT NULL DEFAULT false,
  ticket_token uuid,
  error_message text,
  raw_payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stripe_events_received_at ON public.stripe_webhook_events (received_at DESC);
CREATE INDEX idx_stripe_events_type ON public.stripe_webhook_events (event_type);
CREATE INDEX idx_stripe_events_order_number ON public.stripe_webhook_events (order_number);
CREATE INDEX idx_stripe_events_processing_status ON public.stripe_webhook_events (processing_status);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_webhook_events_admin_all"
  ON public.stripe_webhook_events
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
