
CREATE OR REPLACE FUNCTION public.get_ticket_token_by_order(_order_number text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ticket_token FROM public.orders
  WHERE order_number = _order_number AND payment_status = 'paid'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_ticket_token_by_order(text) TO anon, authenticated;
