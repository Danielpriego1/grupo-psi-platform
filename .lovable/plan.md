## Objetivo
1. Mostrar en el CRM una bitácora destacada de eventos de pago (confirmado / fallido / expirado / **reembolsado**) por oportunidad, además del feed general que ya existe.
2. Agregar pruebas automatizadas que simulen sesiones de Stripe Checkout (éxito, fallo, expiración, reembolso) y verifiquen que el webhook actualiza orden + CRM correctamente.

---

## Parte 1 — Eventos de pago en CRM

### 1.1 Schema (migración)
Agregar valor `'pago'` al enum `public.crm_activity_type` para identificar eventos de pago vs notas/llamadas.

```sql
ALTER TYPE public.crm_activity_type ADD VALUE IF NOT EXISTS 'pago';
```

(El enum existente ya tiene `sora_msg`; el nuevo valor permite filtrar/estilizar pagos.)

### 1.2 Webhook (`supabase/functions/stripe-webhook/index.ts`)
- Cambiar las llamadas `logCrmActivity(...)` de `type: 'sora_msg'` a `type: 'pago'` y enriquecer `metadata` con `event_kind` (`paid|expired|failed|refunded`), `amount`, `currency`, `payment_intent`, `order_number`.
- **Nuevo case `charge.refunded`**: localizar la orden por `payment_intent`, actualizar `orders.payment_status = 'refunded'` y `status = 'cancelled'`, mover la oportunidad CRM a etapa `'perdido'` con `lost_reason = 'Reembolso Stripe'` y `closed_at = now()`, y registrar actividad `'pago'` con monto reembolsado.
- Auditoría: seguir actualizando `stripe_webhook_events` con `payment_status: 'refunded'`.

### 1.3 UI — `src/components/admin/crm/OpportunityDetail.tsx`
- Nueva sección **"Eventos de pago"** arriba del feed general, render solo cuando hay actividades con `type === 'pago'`.
- Cada evento: ícono y color según `metadata.event_kind`:
  - `paid` → verde, `CheckCircle2`
  - `failed` → rojo, `XCircle`
  - `expired` → ámbar, `Clock`
  - `refunded` → naranja oscuro, `RotateCcw`
- Muestra: tipo de evento, número de orden, monto formateado, fecha; link al ticket cuando exista (`/ticket/<token>` ya existe en la app).
- Actualizar `useActivities` para tipar `metadata` como `Record<string, unknown>` (ya viene como jsonb).

### 1.4 UI — nueva página admin (opcional pero pedida)
Crear `src/pages/admin/AdminPaymentEvents.tsx`: vista global con tabla de los últimos 100 eventos de pago (de `crm_activities` filtrando `type='pago'`, joined con `crm_opportunities` para mostrar título y stage). Filtros por tipo de evento, búsqueda por número de orden. Ruta `/admin/payment-events`, agregar entrada en `AdminLayout.tsx` con ícono `Receipt`.

---

## Parte 2 — Pruebas automatizadas del webhook

No usamos Stripe CLI (no disponible en el sandbox). En su lugar, generamos **payloads Stripe sintéticos firmados con `STRIPE_WEBHOOK_SECRET`** y los enviamos al webhook desplegado vía `fetch`. Esto es exactamente lo que hace Stripe CLI internamente (`stripe.webhooks.generateTestHeaderString`).

### 2.1 Archivo `supabase/functions/stripe-webhook/index.test.ts`
- Usa `Deno.test()` + `import "https://deno.land/std@0.224.0/dotenv/load.ts"` para cargar `.env`.
- Helper `postEvent(eventType, dataObject)`:
  - Construye un `Stripe.Event` minimal (id, type, data.object, created).
  - Firma con `Stripe.webhooks.generateTestHeaderString({ payload, secret })`.
  - POST a `${SUPABASE_URL}/functions/v1/stripe-webhook`.
- Helper `seedOrder()` / `seedOpportunity()`: inserta una orden `SOR-TEST-<rand>` y una oportunidad ligada en `crm_opportunities` con `source_ref = order_number`, usando el cliente `service_role` (lee `SUPABASE_SERVICE_ROLE_KEY` de env del test runner — disponible en Deno tests).
- Helper `cleanup()` borra los registros de prueba al final.

### 2.2 Casos cubiertos
| Caso | Evento | Aserción orden | Aserción CRM |
|------|--------|----------------|--------------|
| Éxito | `checkout.session.completed` | `payment_status='paid'`, `ticket_token` generado | oportunidad `stage='ganado'`, `won_amount=total`, actividad `pago/paid` |
| Expirado | `checkout.session.expired` | `payment_status='expired'`, `status='cancelled'` | actividad `pago/expired` (sin cambio de stage) |
| Fallido | `payment_intent.payment_failed` | `payment_status='failed'`, `notes` contiene mensaje | actividad `pago/failed` |
| Reembolso | `charge.refunded` | `payment_status='refunded'` | oportunidad `stage='perdido'`, actividad `pago/refunded` |
| Idempotencia | reenvío del mismo `event.id` éxito | sin duplicación | `stripe_webhook_events` reporta `duplicate:true` |

Cada test consume `response.text()` para evitar fugas de recursos.

### 2.3 Ejecución
- Correr con la herramienta `supabase--test_edge_functions` apuntando a `stripe-webhook`.
- Documentar en el README del test que requiere `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `STRIPE_WEBHOOK_SECRET` en el entorno (todos ya configurados como secrets de Lovable Cloud).

---

## Archivos
- **Migración**: `ALTER TYPE crm_activity_type ADD VALUE 'pago'`
- **Edit**: `supabase/functions/stripe-webhook/index.ts` (refundos + tipo `pago` + metadata enriquecida)
- **Edit**: `src/components/admin/crm/OpportunityDetail.tsx` (sección Eventos de pago)
- **New**: `src/pages/admin/AdminPaymentEvents.tsx` + ruta + entrada en `AdminLayout`
- **New**: `supabase/functions/stripe-webhook/index.test.ts`
- **Edit (small)**: `src/hooks/useCrm.ts` (tipado metadata)
