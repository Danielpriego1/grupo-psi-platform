ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS colors text[] NOT NULL DEFAULT '{}'::text[];