# Implementación end-to-end del flujo de Solicitud de Mantenimiento

## Auditoría (Fase 1) — estado actual

Ya existe gran parte del flujo y funciona contra Supabase real:

- Tabla `maintenance_requests` con todas las columnas equivalentes (los nombres usan `contact_*` en lugar de `customer_*`, ya hay `tracking_code` único, lat/long, estado, etc.).
- RPC `create_maintenance_request` `SECURITY DEFINER` con validaciones y `GRANT EXECUTE TO anon` — el insert sí funciona desde el formulario público.
- RLS correcta: insert público con `WITH CHECK`, select solo para admin o cliente por email.
- `handleSubmit` en `src/pages/Mantenimiento.tsx` ya valida campos, ubicación confirmada, fecha/horario, llama al RPC, muestra `step 4` con el código y maneja errores con `try/catch` + `console.error`.
- Dashboard admin (`src/pages/admin/AdminMaintenance.tsx`) ya lista en tiempo real (`useRealtimeTable`), filtra por status, muestra detalle, mapa con pins y permite cambiar status.

**Brechas reales vs lo pedido:**

1. El folio actual es `MNT-XXXXXX` (random hex). Se pide `MTTO-YYYYMMDD-XXXX` con contador diario.
2. La columna se llama `tracking_code`, no `folio`. Hay que exponerla como `folio` (alias) sin romper código existente ni el flujo de `/rastreo`.
3. La pantalla de éxito (step 4) solo muestra el código y dos botones. Faltan: datos completos del cliente, dirección, fechas, equipos, botones "Descargar confirmación" y "Finalizar".
4. No hay descarga real de comprobante (PDF / vista imprimible).
5. El dashboard admin no muestra una columna explícita con el folio ni un contador de "pendientes/nuevas".
6. No existen columnas `service_type`, `equipment_type`, `confirmation_file_url` como columnas planas (la info de equipos vive en `equipment_items jsonb`, que es más expresivo y ya en uso).

## Cambios planeados

### Fase 2-3 — Modelo y folio (Supabase, una sola migración)

- Renombrar conceptualmente `tracking_code` → `folio` agregando columna **generada/respaldo** sin romper nada: opción elegida = mantener la columna física `tracking_code` y **agregar columna `folio text unique`** poblada por trigger; backfill de filas existentes con el valor de `tracking_code`. Razón: hay código en `/rastreo`, RPC `get_maintenance_by_tracking_code` y dashboard que ya leen `tracking_code`; no se rompe.
- Nueva función `generate_maintenance_folio(_pickup_date date)` `SECURITY DEFINER` que devuelve `MTTO-YYYYMMDD-XXXX` con contador atómico basado en `MAX(substring(folio ...))+1` para esa fecha, dentro de un `LOOP` con re-intento por colisión (la `UNIQUE` constraint garantiza unicidad real).
- Reemplazar `create_maintenance_request` para que:
  - Genere `folio` con la nueva función usando `_scheduled_date` (cae a `current_date` si es null).
  - Inserte `folio` y `tracking_code` con el mismo valor (compatibilidad).
  - Acepte parámetros opcionales nuevos `_service_type text`, `_equipment_type text` (se persisten en columnas nuevas opcionales).
  - **Retorne `jsonb`** con `{ folio, id, created_at }` para que el cliente pueda mostrar la confirmación sin un segundo round-trip.
- Agregar columnas opcionales: `service_type text`, `equipment_type text`, `confirmation_file_url text`.
- Mantener RLS actual (insert público con `WITH CHECK`, select admin/cliente). Verificada — no requiere cambios.

### Fase 4-5 — Envío y confirmación (`src/pages/Mantenimiento.tsx`)

- `handleSubmit`: usar el nuevo retorno `jsonb` del RPC, guardar `folio` + objeto `confirmationData` con todos los campos enviados (nombre, teléfono, email, dirección completa, fechas, equipos, notas) en estado local. No se borran datos si el RPC falla.
- Reemplazar el bloque `step === 4` por un componente `ConfirmationCard` que muestra:
  - Título "Solicitud registrada correctamente"
  - Folio destacado + botón copiar
  - Fecha de solicitud (now), fecha de recolección + horario
  - Nombre, teléfono, email
  - Dirección, estado, municipio, CP
  - Lista de equipos (de `equipment_items`) y notas
  - Estatus inicial: "Pendiente"
  - Botones: **Descargar comprobante (PDF)** y **Finalizar** (resetea form). Se mantiene además "Ver estado".

### Fase 6 — Comprobante PDF descargable

- Nueva utilidad `src/lib/maintenanceReceipt.ts` que genera un PDF cliente-side con **jsPDF** (`bun add jspdf`). Incluye:
  - Logo Grupo PSI (image asset existente) + encabezado
  - Folio en grande, fecha solicitud, fecha recolección
  - Bloque cliente (nombre, tel, email)
  - Bloque dirección (calle, CP, municipio, estado, coords)
  - Tabla de equipos desde `equipment_items`
  - Notas + estatus inicial "Pendiente"
  - Pie: contacto Grupo PSI + nota de validez con folio
- Se descarga como `Comprobante-<folio>.pdf`. Sin red, sin storage — descarga real instantánea.

### Fase 7 — Dashboard admin (`src/pages/admin/AdminMaintenance.tsx`)

- Agregar `folio` al `select` y a la `interface MaintReq`.
- Añadir KPI/contador arriba: "Pendientes: N · Nuevas hoy: M · Total: T".
- En la lista lateral mostrar el `folio` como identificador principal (monospace) además del nombre.
- En el detalle agregar fila con `Folio`, `Fecha de solicitud (created_at)`, `Tipo de servicio/equipo`.
- Mantener el `useRealtimeTable` ya existente — la solicitud nueva aparece sin reload.

### Fase 8 — Permisos

- Verificadas: las RLS actuales cubren todo. La nueva columna `folio` queda implícitamente cubierta por las policies existentes (aplican por fila, no por columna). El RPC `SECURITY DEFINER` sigue bypaseando RLS para insert/retorno. No se requieren cambios adicionales.

## Detalles técnicos

**Migración SQL (resumen):**

```sql
ALTER TABLE public.maintenance_requests
  ADD COLUMN folio text,
  ADD COLUMN service_type text,
  ADD COLUMN equipment_type text,
  ADD COLUMN confirmation_file_url text;

UPDATE public.maintenance_requests SET folio = tracking_code WHERE folio IS NULL;
ALTER TABLE public.maintenance_requests ADD CONSTRAINT maintenance_requests_folio_unique UNIQUE (folio);

CREATE OR REPLACE FUNCTION public.generate_maintenance_folio(_pickup_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date := coalesce(_pickup_date, current_date);
  date_suffix text := to_char(d, 'YYYYMMDD');
  next_seq int;
  candidate text;
BEGIN
  LOOP
    SELECT coalesce(max(substring(folio from 15)::int), 0) + 1 INTO next_seq
      FROM public.maintenance_requests
      WHERE folio LIKE 'MTTO-' || date_suffix || '-%';
    candidate := 'MTTO-' || date_suffix || '-' || lpad(next_seq::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.maintenance_requests WHERE folio = candidate);
  END LOOP;
  RETURN candidate;
END; $$;

-- create_maintenance_request: agrega _service_type, _equipment_type;
-- genera folio; INSERT setea folio = tracking_code = generated_folio;
-- RETURNS jsonb con { folio, id, created_at }.
```

**Dependencia nueva:** `jspdf` (≈40 KB gzip, sin polyfills). Se importa solo en el handler de descarga (code-split via dynamic import).

**Compatibilidad:**

- `/rastreo` y `get_maintenance_by_tracking_code` siguen funcionando porque `tracking_code` mantiene el mismo valor que `folio`.
- Solicitudes históricas (folios antiguos `MNT-XXXXXX`) quedan visibles igual; solo las nuevas usan el formato `MTTO-YYYYMMDD-XXXX`.

## Verificación

1. Enviar formulario completo en preview → ver step 4 con folio `MTTO-...`, descargar PDF y validar contenido.
2. Recargar `/admin/maintenance` → la solicitud aparece arriba con folio y contador "Pendientes" actualizado en realtime.
3. Forzar error (cortando red) → toast claro, datos del form intactos, retry funciona.
4. `psql`: confirmar `SELECT folio, tracking_code, status FROM maintenance_requests ORDER BY created_at DESC LIMIT 3`.
