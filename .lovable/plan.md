## Plan: Configurar y probar el Webhook de Stripe

El endpoint ya existe (`supabase/functions/stripe-webhook/index.ts`) y procesa `checkout.session.completed`, `checkout.session.expired` y `payment_intent.payment_failed`, registrando todo en `stripe_webhook_events`. Falta enlazarlo con Stripe y validarlo de extremo a extremo.

### 1. URL del webhook

Pública (sin JWT, ya está en `config.toml`):
```
https://wcnbqlpbqansyvslxlth.supabase.co/functions/v1/stripe-webhook
```

### 2. Configurar en Stripe Dashboard

Pasos que debe hacer el usuario (te guío en chat):
1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: la de arriba.
3. **Events to send** (seleccionar exactamente estos 3):
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Crear endpoint y copiar el **Signing secret** (`whsec_...`).

### 3. Guardar el Signing Secret

El secret `stripe_webhook_secret` ya existe en el proyecto, pero hay que **actualizarlo** con el valor real del endpoint que se cree. Usaré `update_secret` para `STRIPE_WEBHOOK_SECRET` (el código lee ambos nombres) una vez que el usuario me pase el `whsec_...`.

### 4. Reforzar manejo del payment_intent.payment_failed

Hoy ese caso solo loguea y registra en auditoría, pero **no** actualiza la tabla `orders`. Voy a agregar: buscar la orden por `stripe_payment_intent` y marcar `payment_status='failed'`, `status='cancelled'`, guardar el mensaje de error en `notes`. Así el dashboard refleja pagos fallidos en tiempo real.

### 5. Realtime en `AdminOrders`

Verificar que `AdminOrders` se refresque automáticamente cuando cambie `orders`. Si no usa `useRealtimeTable`, agregarlo para que el estado de pago aparezca al instante sin recargar.

### 6. Pruebas

Tres pruebas, sin tocar dinero real:

**A. Smoke test desde el sandbox** (yo, con `curl_edge_functions`):
- POST sin firma con un payload simulado de `checkout.session.completed` para verificar que la función responde 200 y registra en `stripe_webhook_events`. (Funciona porque el código permite ejecutar sin secret si no hay firma — útil sólo para pruebas internas).

**B. Test card en flujo real** (usuario):
- Crear un pedido pequeño desde el sitio, ir a Stripe Checkout con `4242 4242 4242 4242` (éxito) → debe verse en `/admin/auditoria` como **success** y la orden en `/admin/orders` con `payment_status=paid` y ticket QR generado.
- Tarjeta `4000 0000 0000 0002` (declinada) → evento `payment_intent.payment_failed` → orden marcada `failed`.
- Iniciar checkout y abandonarlo 24h o usar "Send test event" desde Stripe Dashboard para `checkout.session.expired`.

**C. Test events desde Stripe Dashboard**:
- En la página del endpoint, botón **"Send test event"** → elegir cada uno de los 3 eventos. Verificar en `/admin/auditoria` que aparecen con la firma válida y `processing_status=success`.

### 7. Verificación de logs

Revisar logs de la edge function `stripe-webhook` con `edge_function_logs` para confirmar que la firma se valida correctamente y no hay errores.

### Detalles técnicos

- No requiere migración nueva.
- Cambio de código: agregar lógica de update a `orders` en el branch `payment_intent.payment_failed` (intentar por `stripe_payment_intent` y, si Stripe envía `metadata.order_id/order_number`, también).
- Opcional: agregar `useRealtimeTable` en `AdminOrders` si aún no lo tiene.

### Qué necesito de ti para empezar

1. Confirmar que quieres que active el realtime en AdminOrders si no lo tiene.
2. Después de crear el endpoint en Stripe, pasarme el `whsec_...` para actualizarlo en los secrets.
