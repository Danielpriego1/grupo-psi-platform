# Diagnóstico, health checks, logging y monitoreo

## Contexto verificado

- La app es 100% cliente (React/Vite) con backend gestionado: no hay código de servidor propio, así que `/health` y `/ready` se implementan como función de backend, no en nginx.
- `src/App.tsx` no tiene ningún error boundary: hoy un error de render deja pantalla en blanco y solo existe la ruta `*` a `NotFound`.
- Ya existen 24 funciones de backend, entre ellas `send-transactional-email` y `push-send`, reutilizables para alertas.
- El 500 que ves en el dominio lo devuelve nginx en tu VPS, fuera de este proyecto: puedo entregar la configuración exacta, pero aplicarla requiere tu acceso SSH.

## Decisiones tomadas (por defecto)

Publicar en Lovable como respaldo inmediato y además documentar el diagnóstico del VPS; endpoints de backend **y** pantalla visual; alertas por correo, push y tablero en el panel; regeneración de bases con workflow de CI **y** script local con Docker.

## 1. Pantalla de diagnóstico con ID de correlación

- Nuevo `src/lib/errorReporting.ts`: genera un ID de correlación corto (por ejemplo `PSI-4F2A-8C10`), guarda los últimos errores en `sessionStorage` y expone el contexto (ruta, navegador, hora, versión de build).
- Nuevo `src/components/AppErrorBoundary.tsx` envolviendo las rutas en `App.tsx`: ante cualquier error de render muestra una pantalla de marca (sin fondo blanco, con los tokens actuales) con el ID de correlación, botón de copiar, "Reintentar" e "Ir al inicio".
- Nueva ruta pública `/diagnostico` (`src/pages/Diagnostico.tsx`): consulta el estado en vivo de API, base de datos, storage y funciones, muestra semáforo verde/ámbar/rojo, latencias y el ID de correlación de la sesión.

## 2. Endpoints `/health` y `/ready`

- Nueva función `health` que responde en modo `health` (proceso vivo, sin dependencias) y modo `ready` (verifica lectura real en base de datos, listado en storage y una función interna), con latencia por dependencia y código 200 / 503.
- Devuelve JSON con `status`, `checks[]`, `latency_ms`, `correlation_id` y `version`; sin datos sensibles y con CORS.
- Registra cada verificación fallida para que el monitoreo la consuma.

## 3. Logging detallado (app + nginx)

- En la app: registro estructurado de errores de red y de funciones (ruta, estado HTTP, duración, ID de correlación) enviado a una tabla nueva `app_error_logs` con RLS y grants, visible solo para admins.
- Para nginx te entrego, en un archivo `docs/vps-diagnostico.md`, el formato de log con `request_id` y tiempos de upstream, la activación de `error_log ... debug` acotada, y los comandos concretos para leer los logs y encontrar la causa del 500. Yo no puedo aplicarlos: los ejecutas tú por SSH.

## 4. Staging con la misma imagen de Playwright

- Nuevo workflow manual `timeline-baselines.yml` que corre en `mcr.microsoft.com/playwright:v1.56.0-jammy`, regenera las 28 bases y las publica como artefacto y rama/PR para revisión.
- Nuevo `scripts/timeline-baselines.sh` que hace lo mismo en local con Docker, para que el resultado sea idéntico al de CI.
- Cuando las bases vengan de ese entorno, el pixel-diff vuelve a ser bloqueante en `timeline-e2e.yml`.

## 5. Monitoreo y alertas

- Tabla nueva `service_health_checks` (RLS + grants) con resultado, latencia y dependencia fallida de cada verificación.
- Función programada que consulta `/ready` periódicamente, calcula tasa de error y latencia p95, y ante fallo sostenido dispara correo transaccional y push a los admins, con anti-spam (una alerta por incidente y aviso de recuperación).
- Nueva sección en el panel: `/admin/salud` con estado actual, historial, latencias, tasa de fallo y últimos errores 500 con su ID de correlación.

## Notas técnicas

- Todo aditivo: no se modifican Hero, Continuidad Operativa, Servicios, Catálogo, carrito, Stripe ni autenticación.
- Sin librerías nuevas; se reutilizan tokens, componentes shadcn y las funciones de correo/push existentes.
- Las tablas nuevas se crean con RLS activo, políticas por rol admin y sus `GRANT` correspondientes.
- Se añaden pruebas: unitarias del error boundary y del ID de correlación, e integración de `/health` y `/ready` incluyendo el caso de dependencia caída.
