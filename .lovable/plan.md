# Timeline: temas, rendimiento, ARIA y diagnóstico de fallos

Cinco trabajos aditivos sobre la sección Continuidad Operativa. Sin librerías nuevas y sin cambios de diseño visual: se amplían pruebas, se refuerza el marcado accesible y se mejora el diagnóstico en CI.

## 1. Regresión visual en modo oscuro y alto contraste

`tests/e2e/continuidad-timeline-visual.py` hoy corre 19 combinaciones en el tema por defecto. Se añade una dimensión de tema por combinación clave (móvil 375, tablet 768, escritorio 1280):

- **Oscuro** (`color_scheme="dark"` y el tema oscuro persistido en localStorage antes de navegar, como hace el script de arranque del proyecto).
- **Claro** (`color_scheme="light"`), para detectar regresiones del degradado de la línea sobre fondo claro.
- **Alto contraste**: `forced_colors="active"` más `prefers-contrast: more`, que es el caso donde los degradados y `box-shadow` pueden desaparecer.

Bases nuevas con `--update` en `tests/e2e/screenshots/timeline/`, con sufijo de tema en el nombre. En cada tema se sigue exigiendo, antes de capturar, que los cinco nodos de la variante renderizada estén activos.

En modo `forced-colors` los colores del sistema sustituyen a los tokens; si la línea de progreso o el borde de nodo activo quedan invisibles, se añade en `src/index.css` un bloque `@media (forced-colors: active)` que fija bordes y línea con colores de sistema (`CanvasText`/`Highlight`). Es un añadido en el propio archivo de estilos, no un cambio del diseño normal.

## 2. Prueba de rendimiento en CI

Nuevo script `tests/e2e/continuidad-timeline-perf.py`:

- Mide, con marcas de tiempo en el navegador, el intervalo entre el primer y el quinto nodo activado durante un scroll controlado, y el tiempo desde que la sección entra en pantalla hasta el quinto nodo.
- Mide frames durante la animación con `requestAnimationFrame`: calcula FPS medio, peor frame y porcentaje de frames por encima de ~32 ms (frames perdidos a 60 Hz).
- Umbrales configurables por variables de entorno (`TIMELINE_PERF_MAX_LONG_FRAME_PCT`, `TIMELINE_PERF_MAX_ACTIVATION_MS`), con valores iniciales tomados de una primera medición real en este entorno y margen para runners más lentos.
- Se ejecuta en escritorio 1280 y móvil 390, sin `reduced_motion` (necesitamos la animación real).
- Se añade como paso del workflow existente `.github/workflows/timeline-e2e.yml`, después de la regresión visual y a11y.

## 3. Marcado ARIA y semántica del timeline

En `ContinuidadOperativaSection.tsx` el bloque usa hoy `role="list"` en el mismo contenedor que también contiene el encabezado del ciclo de vida, y los pasos son `div` con `role="listitem"` duplicados en variantes escritorio/móvil. Cambios:

- Usar `<ol>`/`<li>` reales para cada variante del timeline, con `aria-label` en la lista ("Ciclo de vida del equipo") y quitar los `role` manuales redundantes.
- El contenedor externo pasa a ser una región con `aria-labelledby` apuntando al rótulo "Ciclo de vida administrado" (que recibe un `id`), en lugar de ser él mismo la lista; sigue siendo el destino de foco del CTA.
- Nombre accesible por paso: cada `li` expone "Paso N de 5: título — descripción" mediante texto visible más `sr-only` donde haga falta, y el número decorativo del círculo queda `aria-hidden`.
- La variante oculta por breakpoint se marca con `aria-hidden` para que los lectores no anuncien los pasos dos veces.
- La barra de progreso decorativa queda explícitamente `aria-hidden`.

## 4. E2E de teclado del CTA en todos los viewports

Nuevo script `tests/e2e/continuidad-timeline-cta-keyboard.py`:

- Recorre la misma matriz de viewports que la regresión visual (densidades, rotación y zoom 50–200%).
- Llega al CTA solo con `Tab` (sin clic), lo activa con `Enter` y repite con `Space`.
- Verifica: el destino recibe el foco (`document.activeElement` es el bloque de continuidad), el bloque queda visible en el viewport, y el anillo de foco es perceptible (captura del elemento enfocado por viewport para inspección).
- Se añade también al workflow de CI.

## 5. Trace, video y capturas al fallar

- Los contextos de Playwright de los scripts del timeline se crean con grabación de vídeo y `tracing.start(screenshots, snapshots, sources)`.
- Si la combinación pasa, se descartan trace y vídeo; si falla, se guardan en `tests/e2e/artifacts/timeline/<caso>/` junto con la imagen `actual`, la base y un PNG de diferencia amplificada.
- Se añade `tests/e2e/artifacts/` a `.gitignore`.
- El workflow ya sube capturas como artefacto al fallar: se amplía ese paso para incluir `tests/e2e/artifacts/`.

## Verificación

- `bunx vitest run` de los tests del timeline (5 casos actuales) más casos nuevos para la estructura `<ol>/<li>` y los nombres accesibles.
- Regresión visual con `--update` y segunda pasada con 0% de diferencia, incluyendo los temas nuevos.
- `continuidad-timeline-a11y.py`, `-perf.py` y `-cta-keyboard.py` sin fallos.
- `bunx tsgo --noEmit` y build limpios.

## Fuera de alcance

Sin librerías nuevas, sin cambios de diseño visual en la sección (salvo el bloque `forced-colors` si la auditoría lo exige), sin tocar otras páginas.
