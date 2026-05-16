# Sistema de Códigos QR — Grupo Psi

QR únicos para equipos y certificados, con páginas de verificación oficiales dentro de la plataforma, generación/regeneración/impresión desde admin y visualización en portal cliente. Todo se actualiza en tiempo real vía Supabase Realtime ya activo.

## Estructura de URLs

- **Certificados**: `/verificar/certificado/{qr_token}` — token UUID seguro (ya existe en `certificates.qr_token`).
- **Equipos**: `/verificar/equipo/{qr_token}` — nuevo token UUID en `equipment`.
- La ruta actual `/verificar/:token` se conserva como redirect a `/verificar/certificado/:token` para no romper QRs ya impresos.

Ningún QR apunta directamente a PDFs ni a IDs incrementales — todos van a páginas que consultan el estatus en vivo.

## Fase 1 — Esquema Supabase

### Cambios en `equipment`
- Añadir columna `qr_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE`.
- Backfill para registros existentes.

### Nueva RPC pública `get_equipment_by_qr(_token uuid)`
- SECURITY DEFINER, devuelve: equipo (tipo, marca, modelo, serie, sucursal), empresa cliente, último servicio (de `maintenance_requests` y `certificates` más recientes), próximo servicio programado (`appointments`), estatus calculado (operativo / mantenimiento pendiente / fuera de servicio basado en certificados vigentes).

### RPC `regenerate_equipment_qr(_id uuid)` y `regenerate_certificate_qr(_id uuid)`
- Solo admins (chequeo con `has_role`), reemplaza el `qr_token` por uno nuevo.

## Fase 2 — Generación de QR

Librería `qrcode` (npm, ya compatible con Vite). Función helper `buildQrUrl(kind, token)` y componente `<QrCode value size />` que renderiza SVG y permite descarga PNG.

Componente `<QrLabel />` con marca Grupo PSI + folio/serie + QR — diseñado para imprimir (1 por hoja o grilla 4x6 etiquetas). Vista `/admin/qr-print?ids=...&kind=...` con `@media print` styling.

## Fase 3 — Páginas de verificación

### `/verificar/certificado/:token` (mejora de la existente)
Ya implementada — solo mover ruta a la nueva URL y mantener alias antiguo.

### `/verificar/equipo/:token` (nueva)
- Header con icono escudo, tipo de equipo y empresa cliente.
- Badge de estatus en vivo (verde operativo / ámbar próximo mantenimiento / rojo vencido).
- Tarjeta de datos: serie, marca, modelo, sucursal.
- Timeline de últimos 5 servicios (mantenimiento + certificados ordenados por fecha).
- Próxima cita si existe.
- Lista de certificados vigentes con badge y link a su verificación.
- Realtime: suscripción a `equipment`, `certificates`, `maintenance_requests`, `appointments` filtrados.

## Fase 4 — Admin y Portal

### Admin
- En `AdminCertificates` sheet: agregar visualización QR + botones **Descargar PNG**, **Imprimir etiqueta**, **Regenerar QR**.
- Nueva página `/admin/equipos` (tabla básica con búsqueda por cliente/serie, dialog de alta/edición, sheet con QR e historial). Item de menú "Equipos".
- Vista `/admin/qr-print` que recibe `?kind=certificate|equipment&ids=...` y muestra etiquetas listas para imprimir (oculta sidebar/header con `print:hidden`).

### Portal cliente (`PortalCertificates`)
- En sheet de detalle de certificado: mostrar QR con botón descargar.
- Nueva sección **Mis equipos** dentro del portal (`/portal/equipos`) con QR por cada equipo y link a su verificación.

## Fase 5 — Compatibilidad y QA

- Ruta `/verificar/:token` legacy redirige a `/verificar/certificado/:token`.
- Sin cambios en `orders`, `deliveries`, `appointments`, `inventory`, calendario.
- QA: escanear QR cert → ver estatus; escanear QR equipo → ver historial; regenerar QR invalida el anterior; impresión muestra etiquetas limpias.

## Orden de implementación

1. Migración: columna y RPCs.
2. Helpers `qrcode` + componentes `<QrCode>` y `<QrLabel>`.
3. Páginas de verificación (equipo + ajuste cert + alias legacy).
4. Vista de impresión `/admin/qr-print`.
5. Integración en `AdminCertificates`, nueva `AdminEquipment`, portal cliente.
