## Objetivo

Extender `/admin/payment-events` con exportación CSV filtrada y tabla paginada/ordenable, y crear una reconciliación Stripe ↔ CRM.

---

## 1. Exportación CSV (frontend)

Editar `src/pages/admin/AdminPaymentEvents.tsx`:

- Añadir dos inputs `type="date"` (Desde / Hasta) al bloque de filtros, junto al buscador y al `Select` de tipo.
- Aplicar el rango de fechas tanto al `useQuery` (con `.gte`/`.lte` sobre `created_at`) como al filtro en memoria.
- Botón "Exportar CSV" (icono `Download`) que toma `filtered` (respeta tipo + rango + búsqueda) y descarga un archivo `payment-events-YYYYMMDD.csv` con columnas: `fecha, tipo, orden, oportunidad, contacto, monto, moneda, payment_intent, stage_oportunidad`. Escapado simple con comillas dobles, BOM UTF-8 para Excel.
- Si no hay rango → se exportan todos los filtrados visibles.

## 2. Paginación + ordenamiento

Misma página:

- Subir el `limit` del query a 1000 y dejar la paginación/ordenamiento del lado cliente (suficiente para el volumen previsto; evita un round-trip por página).
- Estado `sortBy: "created_at" | "amount" | "event_kind"` y `sortDir: "asc" | "desc"` (default `created_at desc`). Headers `<th>` clickeables con indicador (`ArrowUp`/`ArrowDown`).
- Estado `page` y `pageSize` (10 / 25 / 50 / 100, default 25). Controles inferiores: "Mostrando X–Y de Z", botones Anterior/Siguiente y selector de pageSize.
- Reset de `page` cuando cambien filtros, búsqueda, orden o pageSize.
- `amount` y `event_kind` se leen desde `metadata`; el comparador trata `amount` nulo como `-Infinity` en `asc`.

## 3. Reconciliación Stripe ↔ CRM

### Edge function nueva `supabase/functions/stripe-reconcile/index.ts`

- POST con body opcional `{ since?: ISOString, until?: ISOString, dry_run?: boolean }`. Default: últimas 24 h.
- Requiere usuario admin: valida JWT con `SUPABASE_ANON_KEY` + chequea `has_role(uid, 'admin')` vía `service_role`.
- Recorre `stripe.checkout.sessions.list` y `stripe.charges.list` filtrados por `created` en el rango (paginado, `limit: 100`).
- Para cada sesión/charge:
  1. Resuelve la orden por `metadata.order_id` o `client_reference_id` o `metadata.order_number`.
  2. Compara con `orders.payment_status` y con la existencia de un registro en `stripe_webhook_events` (por `event_id` o `stripe_session_id`).
  3. Detecta discrepancias: `paid` en Stripe pero orden ≠ `paid`; `expired`/`failed` sin reflejarse; `charge.refunded` sin marca de reembolso; orden CRM en stage ≠ `ganado`/`perdido` cuando corresponda.
  4. Si `dry_run` → solo arma el reporte. Si no → aplica las mismas mutaciones que el webhook (`orders.payment_status`, `crm_opportunities.stage/won_amount/closed_at/lost_reason`) y registra una `crm_activities` `type: 'pago'` con `metadata.event_kind` + `metadata.reconciled: true` + `metadata.source: 'reconcile'`.
- Respuesta JSON: `{ scanned, mismatches: [...], fixed: n, dry_run }`. Idempotente: antes de insertar la activity verifica que no exista una con el mismo `event_id` para esa oportunidad.
- Sin entrada nueva en `config.toml` (default `verify_jwt = false`, validación en código).

### Cron opcional

Comentar en la respuesta final cómo programarlo con `pg_cron` + `pg_net` cada 6 h llamando a la función con `dry_run: false` (no se ejecuta automáticamente; se documenta y queda a decisión del usuario).

### UI admin para disparar reconciliación

Nueva sección colapsable en `AdminPaymentEvents.tsx` ("Reconciliación Stripe"):

- Inputs `since`/`until` (default últimas 24 h), switch "Dry run" (default on), botón "Ejecutar".
- Llama `supabase.functions.invoke("stripe-reconcile", { body })` y muestra:
  - Contadores: escaneados, discrepancias, corregidos.
  - Lista de discrepancias con `order_number`, tipo detectado, acción aplicada/pendiente.
- Tras un run con `dry_run: false`, invalida la query `["admin-payment-events"]`.

---

## Detalles técnicos

- Sin migraciones de BD; el enum `pago` y `stripe_webhook_events` ya existen.
- Reutilizar `PaymentEventKind` de `useCrm.ts`.
- Stripe SDK: `npm:stripe@^17` (igual que `stripe-webhook`).
- CSV: construir como string en cliente, `new Blob([csv], { type: "text/csv;charset=utf-8;" })`, `URL.createObjectURL` + `<a download>` programático.
- Mantener `refetchInterval: 30_000` actual.

## Archivos

- editar `src/pages/admin/AdminPaymentEvents.tsx`
- crear `supabase/functions/stripe-reconcile/index.ts`
