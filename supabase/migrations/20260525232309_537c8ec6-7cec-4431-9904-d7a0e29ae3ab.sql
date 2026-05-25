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
  _additional_notes text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
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

  INSERT INTO public.maintenance_requests(
    contact_name, contact_phone, contact_email, address, state, municipality,
    postal_code, latitude, longitude, scheduled_date, time_slot,
    equipment_items, total_units, additional_notes
  ) VALUES (
    btrim(_contact_name), btrim(_contact_phone), btrim(_contact_email),
    _address, _state, _municipality, _postal_code, _latitude, _longitude,
    _scheduled_date, _time_slot, coalesce(_equipment_items,'[]'::jsonb),
    coalesce(_total_units,0), _additional_notes
  )
  RETURNING tracking_code INTO new_code;

  RETURN new_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_maintenance_request(
  text,text,text,text,text,text,text,double precision,double precision,date,text,jsonb,integer,text
) TO anon, authenticated;