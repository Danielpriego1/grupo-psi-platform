-- Add tracking_code column
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS tracking_code text UNIQUE;

-- Generator function for unique tracking codes
CREATE OR REPLACE FUNCTION public.generate_maintenance_tracking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  exists_count int;
BEGIN
  LOOP
    candidate := 'MNT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    SELECT count(*) INTO exists_count FROM public.maintenance_requests WHERE tracking_code = candidate;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Trigger to auto-assign tracking code if missing
CREATE OR REPLACE FUNCTION public.set_maintenance_tracking_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_code IS NULL OR NEW.tracking_code = '' THEN
    NEW.tracking_code := public.generate_maintenance_tracking_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_maintenance_tracking_code ON public.maintenance_requests;
CREATE TRIGGER trg_set_maintenance_tracking_code
BEFORE INSERT ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_maintenance_tracking_code();

-- Backfill existing rows
UPDATE public.maintenance_requests
SET tracking_code = public.generate_maintenance_tracking_code()
WHERE tracking_code IS NULL;

-- Public lookup function (security definer) — exposes only safe fields
CREATE OR REPLACE FUNCTION public.get_maintenance_by_tracking_code(_code text)
RETURNS TABLE (
  tracking_code text,
  status maintenance_request_status,
  contact_name text,
  scheduled_date date,
  time_slot text,
  total_units int,
  state text,
  municipality text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tracking_code, status, contact_name, scheduled_date, time_slot,
         total_units, state, municipality, created_at, updated_at
  FROM public.maintenance_requests
  WHERE tracking_code = upper(trim(_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_maintenance_by_tracking_code(text) TO anon, authenticated;