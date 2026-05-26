
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS folio text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS equipment_type text,
  ADD COLUMN IF NOT EXISTS confirmation_file_url text;

UPDATE public.maintenance_requests
   SET folio = tracking_code
 WHERE folio IS NULL AND tracking_code IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_requests_folio_unique'
  ) THEN
    ALTER TABLE public.maintenance_requests
      ADD CONSTRAINT maintenance_requests_folio_unique UNIQUE (folio);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_maintenance_folio(_pickup_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date := coalesce(_pickup_date, current_date);
  date_suffix text := to_char(d, 'YYYYMMDD');
  next_seq int;
  candidate text;
BEGIN
  LOOP
    SELECT coalesce(max((substring(folio from 15))::int), 0) + 1
      INTO next_seq
      FROM public.maintenance_requests
     WHERE folio LIKE 'MTTO-' || date_suffix || '-%'
       AND substring(folio from 15) ~ '^[0-9]+$';

    candidate := 'MTTO-' || date_suffix || '-' || lpad(next_seq::text, 4, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.maintenance_requests WHERE folio = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_maintenance_request(
  _contact_name text,
  _contact_phone text,
  _contact_email text,
  _address text,
  _state text,
  _municipality text,
  _postal_code text,
  _latitude double precision,
  _longitude double precision,
  _scheduled_date date,
  _time_slot text,
  _equipment_items jsonb,
  _total_units integer,
  _additional_notes text,
  _service_type text DEFAULT NULL,
  _equipment_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_folio text;
  new_id uuid;
  new_created_at timestamptz;
BEGIN
  IF length(btrim(coalesce(_contact_name,''))) < 2 THEN
    RAISE EXCEPTION 'invalid_contact_name';
  END IF;
  IF length(btrim(coalesce(_contact_phone,''))) < 7 THEN
    RAISE EXCEPTION 'invalid_contact_phone';
  END IF;
  IF _contact_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'invalid_contact_email';
  END IF;
  IF length(coalesce(_additional_notes,'')) > 5000 THEN
    RAISE EXCEPTION 'notes_too_long';
  END IF;

  new_folio := public.generate_maintenance_folio(_scheduled_date);

  INSERT INTO public.maintenance_requests(
    contact_name, contact_phone, contact_email, address, state, municipality,
    postal_code, latitude, longitude, scheduled_date, time_slot,
    equipment_items, total_units, additional_notes,
    folio, tracking_code, service_type, equipment_type
  ) VALUES (
    btrim(_contact_name), btrim(_contact_phone), btrim(_contact_email),
    _address, _state, _municipality, _postal_code, _latitude, _longitude,
    _scheduled_date, _time_slot, coalesce(_equipment_items,'[]'::jsonb),
    coalesce(_total_units,0), _additional_notes,
    new_folio, new_folio, _service_type, _equipment_type
  )
  RETURNING id, created_at INTO new_id, new_created_at;

  RETURN jsonb_build_object(
    'folio', new_folio,
    'id', new_id,
    'created_at', new_created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_maintenance_request(
  text, text, text, text, text, text, text,
  double precision, double precision, date, text, jsonb, integer, text, text, text
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.generate_maintenance_folio(date) TO anon, authenticated;
