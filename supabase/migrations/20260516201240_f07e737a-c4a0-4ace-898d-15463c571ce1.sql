
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ticket_token uuid;
CREATE INDEX IF NOT EXISTS idx_orders_ticket_token ON public.orders(ticket_token);

CREATE OR REPLACE FUNCTION public.get_order_ticket(_token uuid)
RETURNS TABLE(
  order_number text,
  status order_status,
  payment_status text,
  total numeric,
  paid_at timestamptz,
  created_at timestamptz,
  address text,
  municipality text,
  state text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT order_number, status, payment_status, total, paid_at, created_at,
         address, municipality, state
  FROM public.orders
  WHERE ticket_token = _token
    AND payment_status = 'paid'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_ticket(uuid) TO anon, authenticated;
