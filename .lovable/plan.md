## Plan: Panel de Auditoría de Webhooks de Stripe

Registrar cada evento entrante de Stripe (con timestamp, payment_status, resultado de generación de QR/ticket) y exponerlos en un panel admin.

### 1. Base de datos (migración)

Nueva tabla `public.stripe_webhook_events`:
- `id` uuid PK
- `event_id` text UNIQUE (id del evento Stripe, para idempotencia)
- `event_type` text (`checkout.session.completed`, etc.)
- `stripe_session_id` text
- `stripe_payment_intent` text
- `order_id` uuid, `order_number` text
- `payment_status` text (paid / expired / failed / unknown)
- `processing_status` text (`received`, `success`, `error`, `skipped`)
- `ticket_generated` boolean
- `ticket_token` uuid
- `error_message` text
- `raw_payload` jsonb
- `received_at`, `processed_at` timestamptz
- `created_at` timestamptz default now()

RLS: solo `admin` puede SELECT/ALL. Sin acceso público.
Índices en `event_type`, `received_at desc`, `order_number`.

### 2. Edge function `stripe-webhook` (actualizar)

En cada evento:
1. Insertar fila con `received_at = now()`, `processing_status = 'received'`, `raw_payload`, `event_type`, `event_id`.
2. Tras procesar (update a orders + generar `ticket_token`), hacer UPDATE de la misma fila con `processing_status`, `payment_status`, `ticket_generated`, `ticket_token`, `order_id`, `order_number`, `processed_at`, y `error_message` si falla.
3. Try/catch envolvente: si algo truena, registrar `processing_status='error'` con el mensaje y devolver 500.

Idempotencia: si `event_id` ya existe con `processing_status='success'`, retorna 200 sin reprocesar.

### 3. Frontend admin

**Nueva ruta** `/admin/auditoria` en `src/App.tsx` + entrada en `AdminLayout` (icono `ShieldCheck`, label "Auditoría Stripe").

**Nueva página** `src/pages/admin/AdminStripeAudit.tsx`:
- Tabla con columnas: Fecha (received_at), Tipo evento, Order #, Payment status (badge color), Resultado (success/error/skipped badge), Ticket generado (✓/—), Acciones.
- Filtros: rango de fechas, tipo de evento (select), processing_status, búsqueda por order_number / session_id.
- KPIs arriba: total eventos 24h, % éxito, pagos confirmados, errores.
- Sheet/Dialog "Ver detalle" que muestra `raw_payload` (JSON formateado), error_message, timestamps received/processed, y enlace al pedido.
- Realtime opcional vía `useRealtimeTable` para refrescar al instante.

### 4. Detalles técnicos

- Migración con trigger NO necesario; los timestamps se llenan desde la edge function.
- Edge function usa `service_role` (ya lo hace) para insertar en la tabla.
- Importar `Badge`, `Table`, `Sheet`, `Input`, `Select` de shadcn.
- Reutilizar formato `Intl.DateTimeFormat('es-MX')`.

### Out of scope
- Reintento manual de eventos fallidos (se puede agregar después con un botón "Reprocesar" que invoque una nueva edge function).
- Exportación CSV.
