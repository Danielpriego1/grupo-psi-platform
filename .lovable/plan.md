# Mejoras al control de radio de proximidad de Sora

Cinco cambios acotados sobre `src/components/ChatWidget.tsx`, más migración de backend y pruebas e2e.

## 1. Persistir el radio en el perfil del usuario

- Migración: añadir columna `sora_proximity_radius smallint` (nullable, default null) a `public.profiles`. GRANTs ya existen; policies existentes de "own profile" cubren lectura/escritura.
- En `ChatWidget`: si hay sesión (`supabase.auth.getUser`), al montar leer `profiles.sora_proximity_radius`. Si el valor remoto existe y difiere del local, adoptar el remoto (fuente de verdad entre dispositivos) y actualizar `localStorage`.
- Al cambiar el radio: debounce ~800 ms y hacer `update profiles set sora_proximity_radius = ...` si hay sesión. Sin sesión, comportamiento actual (solo `localStorage` + BroadcastChannel).
- Suscribirse a cambios realtime del propio `profiles` para reflejar cambios hechos en otro dispositivo sin recargar.

## 2. Pruebas e2e con Playwright

- Nuevo script en `/tmp/browser/radius-a11y/` que:
  1. Abre `http://localhost:8080`, activa modo fantasma vía `localStorage.setItem('soraGhost','1')` + reload.
  2. Tab hasta el círculo (`[role="slider"][aria-label*="Sora"]`) y verifica `document.activeElement`.
  3. Envía `ArrowUp` ×3, lee `aria-valuenow` esperado (170), captura screenshot.
  4. Verifica que el badge visual del radio muestra "170 px".
- Se ejecuta directamente con Playwright (no se agrega al pipeline de tests unitarios).

## 3. Tooltip táctil y ocultado al usar teclado

- Detectar interacción táctil (`pointerType === 'touch'`) en el círculo: al `pointerdown` abrir el tooltip controlado (`open` state) y auto-cerrar a los 2.5 s.
- En `handleRadiusKey`: cerrar el tooltip inmediatamente al recibir tecla de ajuste (evita superposición con el anuncio ARIA).
- Añadir `TooltipProvider delayDuration={150}` local para respuesta más ágil.

## 4. Validación de límites (visual + ARIA)

- Nuevo estado `radiusBoundaryHit: 'min' | 'max' | null`.
- En `handleRadiusKey` y en el `onValueChange` del `<Slider>`: cuando el próximo valor quede clamped en el mismo extremo, marcar `radiusBoundaryHit`, limpiar tras 1.2 s.
- Aplicar clase `ring-2 ring-destructive/70 animate-pulse` al círculo y al thumb del slider mientras esté activo.
- Añadir texto en el live region: "Ya alcanzaste el radio mínimo (60 px)" / "…máximo (320 px)".
- Reflejar en `aria-invalid="true"` temporal sobre el slider.

## 5. Sincronización robusta al recargar / red inestable

- Al montar y al detectar `online` (evento `window.online`), reconciliar: leer el perfil de nuevo y volver a emitir un `broadcast({type:'radius'|'ghost'})` para tabs vecinas.
- Añadir `visibilitychange` listener: cuando la pestaña vuelve a estar visible, re-leer perfil si hay sesión.
- Cubrir con test unitario en `ChatWidget.sync.test.tsx`: simular `online` y `visibilitychange`, verificar re-broadcast.

## Detalles técnicos

- Migración vía `supabase--migration`:
  ```sql
  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS sora_proximity_radius smallint
    CHECK (sora_proximity_radius BETWEEN 60 AND 320);
  ```
- Tipos regenerados vía tooling automático (no editar `types.ts` a mano).
- Todo el trabajo nuevo respeta las claves `soraProximityRadius`, `soraGhost` y el canal `sora-widget` ya existentes.
- El botón "Restablecer" seguirá activo; además limpiará `sora_proximity_radius` en el perfil (set null).

¿Procedo con los 5 puntos tal como se describen, o quieres ajustar el alcance (por ejemplo, dejar la persistencia en perfil fuera si aún no quieres tocar el backend)?
