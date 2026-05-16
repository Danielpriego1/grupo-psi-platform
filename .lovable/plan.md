# Página /pago-exitoso con resumen del pago

## Estado actual
`PagoExitoso.tsx` ya existe pero solo muestra el número de pedido y hace polling al `ticket_token`. No muestra el resumen del pedido (productos, total, datos del cliente, método de pago).

## Objetivo
Mostrar un resumen completo del pago al regresar de Stripe: productos comprados, cantidades, subtotales, total pagado, datos del cliente, fecha y un indicador del estado del pago en tiempo real.

## Cambios

### 1. Nuevo edge function `get-checkout-summary`
- Recibe `session_id` (de Stripe) y/o `order_number`
- Con `STRIPE_SECRET_KEY` recupera `stripe.checkout.sessions.retrieve(session_id, { expand: ['line_items', 'payment_intent'] })`
- Cruza con la tabla `orders` (vía service role) y `order_items` para devolver:
  - `order_number`, `payment_status`, `total`, `paid_at`, `created_at`
  - `client_name`, `client_phone` (extraídos de `notes` de la orden)
  - `items[]`: nombre, cantidad, precio unitario, subtotal
  - `stripe_status` ("paid" / "unpaid" / "no_payment_required")
  - `ticket_token` si ya existe
- Público (no requiere JWT) pero validado por la posesión del `session_id`

### 2. Rediseñar `src/pages/PagoExitoso.tsx`
- Leer `session_id` y `order` del query string
- Llamar al edge function al montar
- Layout en dos secciones:
  - **Header**: icono check, "¡Pago confirmado!", número de pedido, fecha
  - **Tarjeta resumen**:
    - Lista de productos (`product_name × qty` ........ `$subtotal`)
    - Separador, total destacado
    - Datos del cliente (nombre, teléfono)
    - Método de pago: "Tarjeta vía Stripe"
- Mantener el polling del `ticket_token` y el botón "Ver mi ticket con QR" cuando esté listo
- Conservar botones de WhatsApp y volver al inicio
- Estado de carga: skeleton mientras llega el resumen
- Estado de error: mensaje claro + CTA WhatsApp si no se puede recuperar la sesión

## Detalles técnicos
- Nuevo archivo: `supabase/functions/get-checkout-summary/index.ts`
- Editado: `src/pages/PagoExitoso.tsx`
- No requiere migraciones: ya existen columnas `paid_at`, `payment_status`, `stripe_session_id`, `ticket_token` en `orders`, y `order_items` ya tiene `product_name`, `quantity`, `unit_price`, `subtotal`.
- `notes` de `orders` ya contiene `Cliente: X | Tel: Y | Pago: Stripe` → parseo simple para extraer nombre y teléfono.
- Sin cambios de RLS: el edge function usa service role.

## Fuera de alcance
- Generación del ticket QR (ya implementada vía webhook).
- Envío de email al cliente (ya existe flujo).
- Cambios en el flujo de checkout o webhook.

¿Procedo con esta implementación?
