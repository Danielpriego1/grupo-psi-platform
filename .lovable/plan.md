# Validación de success_url y cancel_url

## Objetivo
Confirmar que tras un pago en Stripe Checkout:
- **Éxito** → redirige a `https://checkout.grupopsi.com/pago-exitoso?session_id=...&order=...`
- **Cancelar** → redirige a `https://checkout.grupopsi.com/`

## Estado actual del código
En `supabase/functions/create-checkout-session/index.ts` (líneas 77-78) ya están hardcodeados:
```
success_url: successUrl || `https://checkout.grupopsi.com/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`
cancel_url:  cancelUrl  || `https://checkout.grupopsi.com/`
```
El fallback apunta al dominio correcto, pero el frontend puede estar enviando `successUrl`/`cancelUrl` que sobrescriban este valor.

## Pasos de validación

1. **Revisar el frontend** (`CartDrawer.tsx` y cualquier llamada a `create-checkout-session`) para verificar si envía `successUrl`/`cancelUrl`. Si los envía apuntando al preview de Lovable, esos valores ganan sobre el fallback.
   - Decisión: o eliminar los parámetros desde el cliente, o forzar el dominio custom en el edge function ignorando el body.

2. **Forzar dominio custom en el edge function** (recomendado): eliminar el fallback `||` y siempre construir las URLs con `https://checkout.grupopsi.com/...`, ignorando lo que mande el cliente. Esto garantiza consistencia incluso si alguien llama desde preview.

3. **Prueba end-to-end con Stripe test**:
   - Agregar producto al carrito en `https://checkout.grupopsi.com`
   - Iniciar checkout, usar tarjeta `4242 4242 4242 4242`
   - Confirmar que tras pagar la URL del navegador sea `https://checkout.grupopsi.com/pago-exitoso?session_id=cs_test_...&order=GRP-...`
   - Repetir y dar clic en "Volver" en Stripe → confirmar redirección a `https://checkout.grupopsi.com/`

4. **Verificación en BD**: consultar `orders` para la `order_number` recién creada y confirmar `payment_status = 'paid'`, `paid_at` poblado, `ticket_token` generado.

## Detalles técnicos
- Archivo a editar: `supabase/functions/create-checkout-session/index.ts` (líneas 77-78), si decides forzar dominio.
- Cambio propuesto:
  ```ts
  const baseUrl = "https://checkout.grupopsi.com";
  success_url: `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
  cancel_url:  `${baseUrl}/`,
  ```
- No requiere migraciones ni cambios de UI.

## Pregunta
¿Quieres que **fuerce** el dominio `checkout.grupopsi.com` en el edge function (ignorando `successUrl`/`cancelUrl` del cliente), o prefieres mantener el override del cliente y solo hacer la prueba manual en producción?
