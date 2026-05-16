## Reporte de auditoría + plan de correcciones

### Estado actual verificado

| Área | Estado |
|---|---|
| Frontend público, auth, portal, admin (12 secciones), 9 edge functions | OK estructural |
| Stripe webhook recibe eventos y los registra | OK |
| **Stripe webhook → tabla `orders`** | 🔴 No actualiza la orden (1 evento `success` en auditoría pero 0 órdenes `paid`) |
| `scripts/keep-alive.sh` | 🟠 Dos scripts concatenados, segunda mitad apunta a un proyecto Supabase distinto |
| `supabase/.temp/linked-project.json` | 🟠 Ref `faadsipcsecmulwhbjah` ≠ proyecto activo `wcnbqlpbqansyvslxlth` |
| Portal cliente | 🟡 Vacío porque `clients` = 0 filas y el trigger solo vincula si ya existe el cliente |
| Linter Supabase | 28 warnings, todas `SECURITY DEFINER` aceptadas — sin acción |

Datos: 16 órdenes (0 pagadas), 168 productos, 2 mantenimientos, 1 evento Stripe.

### Correcciones a aplicar

**1. 🔴 Stripe webhook → órdenes (bloqueador)**
- Revisar `supabase/functions/stripe-webhook/index.ts` y reforzar el matching de la orden por `session.id`, `payment_intent` y `metadata.order_number` (los 3, en cascada).
- Agregar logs explícitos cuando no se encuentre la orden y marcar `processing_status='orphan'` en `stripe_webhook_events` en vez de `success` falso.
- Actualizar `orders` con `payment_status='paid'`, `status='confirmed'`, `paid_at=now()`, `ticket_token=gen_random_uuid()` cuando llegue `checkout.session.completed`.
- Manejar `payment_intent.payment_failed`: marcar `payment_status='failed'`, `status='cancelled'`, guardar mensaje en `notes`.
- Redesplegar la función.

**2. 🟠 Reparar `scripts/keep-alive.sh`**
- Dejar un solo bloque apuntando a `wcnbqlpbqansyvslxlth`.

**3. 🟠 Sincronizar `linked-project.json`**
- Actualizar `ref` y `name` al proyecto activo para que el repo `grupo-psi-app` en GitHub no haga push a la BD equivocada.

**4. 🟡 Auto-vincular cliente al registrarse**
- Modificar el trigger `handle_new_user` para que, si no existe un `clients` con ese email, **cree uno** con `email`, `contact_name` (de `full_name`) y `user_id = NEW.id`. Así el portal funciona desde el primer login.

**5. 🟢 Limpieza opcional**
- Marcar las 4 órdenes `COT-...` de abril como `archived` (campo `notes`) o dejarlas como están — dime.
- Silenciar los warnings de React Router v6 con `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`.

### Cómo voy a validar después

1. `curl_edge_functions` al webhook con un payload simulado de `checkout.session.completed` con `metadata.order_number` de una orden real → debe quedar `paid` con `ticket_token`.
2. Revisar `edge_function_logs` de `stripe-webhook` para confirmar branch correcto.
3. Crear un usuario de prueba y verificar que aparece en `clients`.

### Lo que necesito de ti después

- Hacer **un pago real de prueba** con `4242 4242 4242 4242` desde el sitio para confirmar el ciclo completo end-to-end (no puedo hacerlo yo desde el sandbox).
- Confirmar en Stripe Dashboard que el webhook apunta a:
  `https://wcnbqlpbqansyvslxlth.supabase.co/functions/v1/stripe-webhook`

### Sobre el repo GitHub `grupo-psi-app`

No tengo acceso directo a GitHub. Si el repo está sincronizado con este proyecto Lovable, los cambios se pushean solos. Si es un fork separado, dime su URL para revisarlo aparte.

---

**Aprueba este plan y ejecuto los 4 puntos críticos (1-4) en orden.** El punto 5 lo hago solo si me lo confirmas.
