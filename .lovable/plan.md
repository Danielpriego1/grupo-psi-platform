# Calendario unificado + Realtime bidireccional

## Resumen

Hoy ya existe `AppointmentsCalendar` (react-big-calendar) en el dashboard, pero solo muestra mantenimientos y entregas y no tiene filtros, panel de detalle, vista día ni realtime. No existe tabla `appointments`. Vamos a crearla, unificar los 4 orígenes de eventos en una sola vista, rediseñar la UI estilo Notion Calendar y conectar Supabase Realtime en todas las pantallas operativas.

Sin tocar Stripe, carrito, página pública ni edge functions existentes.

---

## Fase 1 — Esquema en Supabase

### 1.1 Nueva tabla `appointments` (visitas / citas comerciales)

Campos de dominio: `client_id`, `contact_name`, `contact_phone`, `assigned_to` (uuid del técnico/vendedor), `appointment_type` (enum: `visit`, `inspection`, `pickup`, `meeting`), `status` (enum: `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`), `scheduled_at` (timestamptz), `duration_minutes`, `address`, `state`, `municipality`, `latitude`, `longitude`, `notes`, `internal_notes`.

RLS: admin y vendor pueden gestionar; cualquier autenticado puede ver.

### 1.2 Vista unificada `calendar_events`

`CREATE VIEW public.calendar_events AS` — UNION ALL de las 4 tablas, normalizando columnas:

```
id (uuid) | source ('appointment'|'maintenance'|'delivery'|'order')
title | event_type | status | start_at (timestamptz) | end_at
client_name | address | state | municipality
assigned_to | contact_phone | notes | internal_notes
source_id (uuid del registro original)
```

- `appointments` → start = `scheduled_at`, end = `scheduled_at + duration_minutes`
- `maintenance_requests` → start = `scheduled_date + time_slot`, end = +2h
- `deliveries` → start = `scheduled_date 09:00`, end = +1h
- `orders` con `status IN ('pending','confirmed')` → como hito (start = `created_at`, end = +30min)

La vista corre con permisos del usuario; cada tabla ya tiene su RLS. No requiere RLS adicional.

### 1.3 Habilitar Realtime

`ALTER PUBLICATION supabase_realtime ADD TABLE appointments, orders, maintenance_requests, deliveries;` y `REPLICA IDENTITY FULL` en las 4 para recibir el row completo en updates/deletes.

---

## Fase 2 — Hook compartido de Realtime

`src/hooks/useRealtimeTable.ts` — wrapper genérico que suscribe a `postgres_changes` de una tabla y dispara un callback (`onInsert`, `onUpdate`, `onDelete`) o invalida una React Query key. Se usa en:

- `AdminOrders`, `AdminMaintenance`, `AdminDeliveries`, `AdminClients`, `AdminInventory` (los que ya hacen fetch manual pasan a auto-refrescar).
- Nuevo módulo de calendario y citas.

Bidireccional "gratis": cualquier insert/update desde web o app móvil que use el mismo Supabase project notifica a todos los clientes suscritos.

---

## Fase 3 — Módulo de calendario

Nueva ruta `/admin/calendario` + entrada en `AdminLayout`. Reemplaza el widget actual del dashboard por una versión mini que enlaza al módulo completo (no se borra, se simplifica).

### Estructura

```
src/pages/admin/AdminCalendar.tsx
src/components/admin/calendar/
  CalendarHeader.tsx        toolbar: hoy, ‹ ›, día/semana/mes, "+ Nueva cita"
  CalendarFilters.tsx       chips multiselect: tipo, estado, cliente, técnico
  MonthView.tsx             grid 7×n, eventos como pills (max 3 + "+N more")
  WeekView.tsx              7 columnas, slots de 30 min, eventos absolutos
  DayView.tsx               1 columna ancha, slots de 15 min
  EventPill.tsx             borde izquierdo coloreado por tipo, texto sobrio
  EventDetailSheet.tsx      Sheet lateral con todos los campos + acciones
  AppointmentFormDialog.tsx crear/editar cita
useCalendarEvents.ts        query a calendar_events + filtros + realtime
```

Reemplazo de `react-big-calendar` por una implementación propia con `date-fns` para tener el look Notion (no es razonable estilizar RBC a ese nivel). Mantengo RBC instalado por compatibilidad con el widget del dashboard mientras tanto.

### Diseño Notion-like

- Fondo `bg-background`, divisores `border-border/60`, sin gradientes.
- Encabezados de día en `text-xs uppercase tracking-wide text-muted-foreground`.
- Eventos: pill `h-6 rounded-sm` con barra izquierda 2px del color del tipo y resto en `bg-muted/40`.
- Paleta sobria por tipo: visita `slate`, mantenimiento `amber`, entrega `sky`, recolección `violet`, orden `emerald`. Solo la barra lateral lleva color; el texto siempre `foreground`.
- Hover: `bg-muted` + cursor pointer. "Hoy" marcado con un punto bajo el número, no con fondo.
- Sheet lateral 420px, header con tipo + estado en badge outline, secciones: Cliente, Ubicación (con link a Maps), Responsable, Notas, Notas internas. Footer con acciones rápidas: Confirmar / Marcar completada / Cancelar / Editar / Abrir registro origen.

### Acciones rápidas

Cada acción es un UPDATE sobre la tabla de origen (`source` + `source_id` saben a qué tabla ir). Realtime propaga el cambio a todos los clientes incluyendo el panel abierto.

---

## Fase 4 — Integración móvil

La app móvil (consumidor existente del mismo Supabase) no requiere cambios de protocolo. Sólo necesita:
1. Estar suscrita a las mismas tablas vía Realtime (instrucciones quedan en `README` del módulo).
2. Si quiere mostrar el calendario unificado, leer de la vista `calendar_events`.

No tocamos código de la app móvil desde este repo.

---

## Detalles técnicos

- React Query para cache; cada handler de realtime hace `queryClient.setQueryData` por id (evita refetch innecesario).
- Filtros se resuelven en cliente sobre el array memoizado — el dataset operativo es chico (< 5k eventos visibles).
- Zonas horarias: todo en `America/Mexico_City`, conversión con `date-fns-tz` (ya disponible vía date-fns).
- TypeScript: tipos derivados de `Database['public']['Views']['calendar_events']['Row']` que aparecerán tras la migración.
- A11y: navegación con teclado en grid (`role="grid"`, flechas para moverse, Enter para abrir).

---

## Orden de ejecución

1. Migración SQL (enum, tabla `appointments`, vista `calendar_events`, RLS, realtime publication, replica identity).
2. Hook `useRealtimeTable` + suscripciones en pantallas admin existentes (refresh automático sin romper nada).
3. Módulo de calendario: ruta, layout, vistas mes/semana/día, filtros, sheet de detalle, formulario de citas.
4. Simplificar `AppointmentsCalendar` del dashboard a un "próximos 7 días" que enlaza al módulo.
5. QA: crear cita en web, verificar que aparece sin recargar en una segunda pestaña; actualizar mantenimiento desde Admin Mantenimiento y ver el cambio reflejado en el calendario al instante.
