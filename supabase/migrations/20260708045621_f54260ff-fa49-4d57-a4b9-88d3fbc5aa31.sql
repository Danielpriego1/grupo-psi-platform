
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS last_delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS kinds text[] NOT NULL DEFAULT ARRAY['order','quote','maintenance']::text[],
  ADD COLUMN IF NOT EXISTS sound boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
