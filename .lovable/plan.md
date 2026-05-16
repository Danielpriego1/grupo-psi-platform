# Módulo de Certificados — Grupo Psi

Sistema completo de certificados de servicio (mantenimiento, calibración, hidrostática, pureza de aire, PosiChek) con portal de cliente, gestión admin y cobro Stripe para copias adicionales.

## Alcance

- Emisión, almacenamiento, búsqueda y verificación QR de certificados.
- Portal del cliente: lista, filtros, detalle y descarga.
- Primera emisión gratuita (incluida en el servicio). Reemisiones/copias adicionales cobradas vía Stripe.
- Panel admin: subir, regenerar, reemplazar PDFs, ver estatus de pago.
- Sincronización en tiempo real (Supabase Realtime) con dashboard, calendario, historial de equipos.

## Fase 1 — Esquema Supabase

### Nuevas tablas

**`equipment`** (catálogo de equipos del cliente)
- `client_id`, `serial_number`, `equipment_type` (enum: `scba`, `cilindro`, `compresor`, `mascara`, `otro`), `brand`, `model`, `branch_name` (sucursal/base), `notes`.

**`certificates`**
- `folio` (único, formato `PSI-{TIPO}-{YYYY}-{NNNNN}`), `client_id`, `equipment_id` (nullable), `service_type` (enum: `mantenimiento`, `calibracion`, `hidrostatica`, `pureza_aire`, `posichek`), `branch_name`, `issued_at`, `valid_until`, `pdf_url` (storage), `qr_token` (uuid público), `status` (enum: `vigente`, `por_vencer`, `vencido`, `revocado`), `issued_by` (uuid admin), `source_request_id` (referencia opcional a maintenance/order/appointment), `notes`.

**`certificate_copy_requests`**
- `certificate_id`, `requested_by` (uuid usuario), `stripe_session_id`, `amount_mxn`, `payment_status` (enum: `pending`, `paid`, `failed`, `refunded`), `paid_at`, `download_token`, `expires_at`.

### Storage
Bucket privado `certificates` con RLS:
- Admins: gestión total.
- Clientes autenticados: solo sus PDFs (primera emisión gratis O copia pagada).

### RPC pública
`get_certificate_by_qr(_token uuid)` → SECURITY DEFINER, devuelve datos de verificación (folio, cliente, equipo, fechas, estatus) sin PDF — alimenta página pública `/verificar/{token}`.

### Realtime
Habilitar `REPLICA IDENTITY FULL` y publication para `certificates` y `certificate_copy_requests`.

## Fase 2 — Stripe: cobro de copias

Edge functions nuevas:

1. **`create-certificate-copy-checkout`** — recibe `certificate_id`, valida que el solicitante sea el dueño/admin, crea sesión Stripe Checkout (price one-shot configurable, default $250 MXN), inserta `certificate_copy_requests` con `payment_status=pending`, retorna `url`.
2. **`certificate-copy-webhook`** — endpoint público con `verify_jwt = false`, valida firma Stripe, en `checkout.session.completed` marca request como `paid`, genera `download_token` y `expires_at` (72h).
3. **`download-certificate`** — valida que el usuario sea admin, sea dueño con primera emisión, o presente un `download_token` válido y no expirado; devuelve signed URL del PDF.

Secret necesario: `STRIPE_WEBHOOK_SECRET` (pedir vía add_secret cuando empecemos la fase). `STRIPE_SECRET_KEY` ya existe.

## Fase 3 — Frontend

### Portal cliente (`/portal/certificados`)
- Tabla SaaS con columnas: Folio, Equipo, Tipo de servicio, Sucursal, Emisión, Vigencia, Estatus (badge color).
- Filtros: tipo, equipo, rango de fecha, estatus.
- Sheet lateral de detalle con metadatos, botón **Descargar PDF** (gratis si primera emisión) y **Solicitar copia certificada** (abre Checkout Stripe).
- Estado "Pago confirmado → Descarga lista" con toast y refresco realtime.

### Admin (`/admin/certificados`)
- Tabla con filtros + columna pago de copia.
- Acciones: **Emitir certificado** (form: cliente, equipo, tipo, fechas, upload PDF), **Regenerar**, **Reemplazar PDF**, **Revocar**.
- Sheet de detalle con historial de copias solicitadas/pagadas.

### Verificación pública (`/verificar/:token`)
- Página minimal: folio, cliente, equipo, tipo, vigencia, badge de estatus. Sin descarga.

### Integraciones cruzadas
- En **detalle del equipo** (nuevo o existente): tab "Certificados" filtrado por `equipment_id`.
- En **calendario / detalle de servicio** (maintenance, appointment): enlace "Ver certificados generados" filtrado por `source_request_id`.
- En **historial del cliente** (admin): sección de certificados.

### Realtime
Reusar `useRealtimeTable` ya existente para `certificates` y `certificate_copy_requests` en las vistas admin y portal.

## Diseño

- Tablas con `border-border/60`, badges `rounded-sm` discretos por estatus (verde vigente, ámbar por vencer, rojo vencido, gris revocado).
- Sheet lateral 420px (mismo patrón que calendario).
- Sin gradientes, mucho espacio en blanco, tipografía limpia.

## Orden de implementación

1. Migración Supabase (tablas + enums + storage bucket + RLS + RPC verificación + realtime).
2. Edge functions Stripe (checkout, webhook, download) + secret webhook.
3. Hooks (`useCertificates`, `useCertificateCopyCheckout`) + servicios.
4. Portal cliente: lista, filtros, detalle, flujo de pago.
5. Admin: lista, form emisión, upload/replace PDF.
6. Página pública de verificación QR.
7. Integraciones en detalle equipo, calendario e historial cliente.
8. QA: emisión, descarga gratis, pago de copia, webhook, realtime, QR.

## Compatibilidad

No se tocan `orders`, `maintenance_requests`, `deliveries`, `appointments`, `inventory`, ni el calendario existente — solo se agregan relaciones opcionales (`source_request_id` apunta por id sin FK estricto para permitir referencias multi-tabla).
