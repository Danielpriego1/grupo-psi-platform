ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sora_proximity_radius smallint
  CHECK (sora_proximity_radius IS NULL OR sora_proximity_radius BETWEEN 60 AND 320);