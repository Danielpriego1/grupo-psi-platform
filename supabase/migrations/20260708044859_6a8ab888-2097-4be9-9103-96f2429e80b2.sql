
CREATE OR REPLACE FUNCTION public.notify_push_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  is_quote boolean;
  title text;
  body_text text;
  total_text text;
BEGIN
  is_quote := (NEW.order_number IS NOT NULL AND NEW.order_number LIKE 'COT-%');
  total_text := CASE WHEN NEW.total IS NOT NULL
    THEN ' · $' || to_char(NEW.total, 'FM999,999,999') ELSE '' END;
  IF is_quote THEN
    title := 'Nueva cotización · ' || COALESCE(NEW.order_number, '');
  ELSE
    title := 'Nuevo pedido · ' || COALESCE(NEW.order_number, '');
  END IF;
  body_text := COALESCE(NEW.contact_name, 'Cliente') || total_text;

  BEGIN
    PERFORM net.http_post(
      url := 'https://wcnbqlpbqansyvslxlth.supabase.co/functions/v1/push-send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := jsonb_build_object(
        'title', title,
        'body', body_text,
        'url', '/admin/orders',
        'tag', CASE WHEN is_quote THEN 'quote' ELSE 'order' END,
        'kind', CASE WHEN is_quote THEN 'quote' ELSE 'order' END,
        'ref_number', NEW.order_number
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_push_order failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_push_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  title text;
  body_text text;
BEGIN
  title := 'Solicitud de mantenimiento · ' || COALESCE(NEW.folio, NEW.tracking_code, '');
  body_text := COALESCE(NEW.contact_name, 'Solicitud nueva')
    || CASE WHEN NEW.total_units IS NOT NULL THEN ' · ' || NEW.total_units || ' equipos' ELSE '' END
    || CASE WHEN NEW.municipality IS NOT NULL THEN ' · ' || NEW.municipality ELSE '' END;

  BEGIN
    PERFORM net.http_post(
      url := 'https://wcnbqlpbqansyvslxlth.supabase.co/functions/v1/push-send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := jsonb_build_object(
        'title', title,
        'body', body_text,
        'url', '/admin/maintenance',
        'tag', 'maintenance',
        'kind', 'maintenance',
        'ref_number', COALESCE(NEW.folio, NEW.tracking_code)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_push_maintenance failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;
