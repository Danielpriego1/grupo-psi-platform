# Timeline: cobertura ampliada, CI y CTA accesible

Tres trabajos aditivos sobre la sección Continuidad Operativa. No se toca el diseño ni el contenido de la sección: solo se amplían pruebas, se añade un workflow de CI y se refuerza el comportamiento del CTA al activarse con teclado.

## 1. Ampliar la matriz de regresión visual

`tests/e2e/continuidad-timeline-visual.py` hoy cubre 5 viewports (375/dpr3, 414/dpr2, 768/dpr2, 1280/dpr1, 1920/dpr2). Se amplía con:

- **Zoom del navegador**: 50%, 75%, 100%, 150% y 200% simulados sobre un viewport de escritorio (1280) y uno móvil (390), aplicando el zoom vía `device_scale_factor` combinado con el ancho CSS equivalente, que es la forma fiable de reproducir zoom en Chromium headless.
- **Rotación en móviles**: pares retrato/paisaje para 375x667 / 667x375 y 414x896 / 896x414.

En cada combinación se sigue validando, antes de capturar, que los 5 nodos de la variante visible estén activos; si la variante horizontal y vertical cambian por breakpoint, el chequeo se hace sobre la que esté renderizada. Bases nuevas se generan con `--update` y se guardan junto a las actuales en `tests/e2e/screenshots/timeline/`.

Para paisaje móvil y zoom 200% la sección puede necesitar más scroll: el script hará scroll progresivo hasta que todos los nodos estén activos, con un límite de intentos, en lugar de un solo `scroll_into_view`.

## 2. Integrar los tests en CI

Nuevo workflow `.github/workflows/timeline-e2e.yml`, con el mismo estilo que el existente `bundle-size.yml` (bun, `pull_request` a main y `push` a main):

- Instala dependencias con bun, hace `bun run build` y sirve el build en un puerto local.
- Instala Playwright + Chromium y Pillow en el runner.
- Ejecuta `tests/e2e/continuidad-timeline-visual.py` y `tests/e2e/continuidad-timeline-a11y.py` apuntando a la URL servida (`APP_URL`).
- Si alguna comparación de screenshots o la auditoría axe falla, el job falla y bloquea el merge (el bloqueo efectivo requiere marcar el job como *required status check* en la configuración del repositorio, paso que se documenta en el propio workflow).
- En caso de fallo, sube como artefacto las capturas `actual/` y los diffs para poder revisarlos desde el PR.

Nota: las bases de screenshots se generan en este entorno; si el runner de CI renderiza con mínimas diferencias de fuentes, se ajustará la tolerancia por caso (hoy 0.5%) tras la primera ejecución real.

## 3. CTA con desplazamiento accesible

Hoy el CTA es un ancla `href="#servicio-administrativo"` que apunta al bloque del timeline, pero ese destino no recibe foco, así que un usuario de teclado o lector de pantalla activa el botón y no obtiene contexto inmediato.

Cambios en `ContinuidadOperativaSection.tsx`:

- Al activar el CTA (click o Enter/Espacio), desplazamiento suave programático hacia el bloque de continuidad operativa, respetando `prefers-reduced-motion` (salto instantáneo cuando el usuario lo pide).
- El destino recibe `tabIndex={-1}` y foco programático, de forma que los lectores de pantalla anuncien el título del ciclo de vida al llegar; el foco no añade paradas de tabulación extra.
- Se conserva el `href` real para que siga funcionando sin JavaScript y para el comportamiento de "abrir en nueva pestaña".
- El anclaje `#servicio-administrativo` se mantiene intacto para la futura página del Servicio Administrativo.

## Verificación

- `bunx vitest run` del test unitario del timeline (4 casos ya existentes) más un caso nuevo que verifica que activar el CTA mueve el foco al destino.
- `python3 tests/e2e/continuidad-timeline-visual.py --update` para crear bases nuevas y una segunda pasada para confirmar 0% de diferencia.
- `python3 tests/e2e/continuidad-timeline-a11y.py` sin violaciones.
- `bunx tsgo --noEmit` y build limpio.

## Fuera de alcance

Sin librerías nuevas, sin cambios de diseño en la sección, sin tocar otras páginas ni el resto del Home.
