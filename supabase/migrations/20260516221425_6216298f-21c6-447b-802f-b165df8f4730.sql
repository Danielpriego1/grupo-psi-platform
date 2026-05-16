CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matched_count int;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- Vincular cliente existente por email
  UPDATE public.clients
     SET user_id = NEW.id
   WHERE user_id IS NULL
     AND email IS NOT NULL
     AND lower(email) = lower(NEW.email);

  GET DIAGNOSTICS matched_count = ROW_COUNT;

  -- Si no había cliente previo con ese email, crear uno
  IF matched_count = 0 THEN
    INSERT INTO public.clients (user_id, email, company_name, contact_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
  END IF;

  RETURN NEW;
END;
$function$;