# Diagnóstico de errores 500 (VPS + Nginx)

Guía para rastrear un error 500 usando el ID de correlación que muestra la app.

## 1. Piezas ya integradas en la app

| Pieza | Dónde | Para qué |
| --- | --- | --- |
| Pantalla de diagnóstico pública | `/diagnostico` | Estado en vivo de API, base de datos, storage y funciones + ID de correlación |
| Pantalla de error global | cualquier ruta que falle al renderizar | Muestra el ID, permite copiarlo y reintentar |
| Panel de salud | `/admin/salud` | Latencia promedio y p95, tasa de fallo 24 h, incidentes y últimos errores |
| Liveness | `GET /functions/v1/health?mode=health` | ¿Responde la capa de API? (sin dependencias) |
| Readiness | `GET /functions/v1/health?mode=ready` | Base de datos, storage, auth y funciones. `503` si todo falla |
| Monitoreo y alertas | función `health-monitor` | Correo + push al abrir incidente y al recuperarse |

El ID de correlación tiene el formato `PSI-XXXX-XXXX` y es el mismo en la
pantalla del usuario, en la tabla `app_error_logs` y en la respuesta de
`/health?mode=ready`.

## 2. Logging detallado en Nginx

Añadir en el bloque `http` de `/etc/nginx/nginx.conf`:

```nginx
log_format psi_detallado '$remote_addr - $host "$request" '
                         'status=$status bytes=$body_bytes_sent '
                         'req_time=$request_time upstream_time=$upstream_response_time '
                         'req_id=$request_id psi_id="$http_x_psi_correlation_id" '
                         'ref="$http_referer" ua="$http_user_agent"';
```

Y en el `server` del sitio:

```nginx
access_log /var/log/nginx/grupopsi.access.log psi_detallado;
error_log  /var/log/nginx/grupopsi.error.log warn;

# Propagar los IDs hacia la app
proxy_set_header X-Request-Id $request_id;
proxy_set_header X-PSI-Correlation-Id $http_x_psi_correlation_id;
```

Recargar sin cortar el servicio:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 3. Buscar un error 500 concreto

```bash
# Por ID de correlación que reportó el usuario
sudo grep 'PSI-4F2A-8C10' /var/log/nginx/grupopsi.access.log

# Todos los 500 de hoy, con la ruta y el tiempo de upstream
sudo grep 'status=5' /var/log/nginx/grupopsi.access.log | tail -50

# Errores del proxy/upstream
sudo tail -100 /var/log/nginx/grupopsi.error.log

# Logs de la app si corre con systemd o pm2
sudo journalctl -u grupopsi -n 200 --no-pager
pm2 logs grupopsi --lines 200
```

Causas más frecuentes de 500 en este stack:

1. Variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` ausentes o
   con valores de otro entorno en el build del VPS.
2. `root` de Nginx apuntando a un `dist/` viejo o vacío tras un deploy fallido.
3. Falta el fallback SPA: sin `try_files $uri /index.html;` cualquier ruta
   profunda devuelve error.
4. Upstream caído (`502`/`500` con `upstream_time` vacío).

## 4. Verificación rápida de salud desde el VPS

```bash
curl -s -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
  "$VITE_SUPABASE_URL/functions/v1/health?mode=health"

curl -s -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
  "$VITE_SUPABASE_URL/functions/v1/health?mode=ready" | python3 -m json.tool
```

Un `mode=health` en `ok` con `mode=ready` en `degraded` señala que el problema
está en una dependencia (base de datos, storage, auth o funciones), no en la
capa web del VPS.

## 5. Monitoreo continuo

`health-monitor` guarda cada verificación en `service_health_checks`, abre un
incidente en `service_health_incidents` tras 2 fallas consecutivas, alerta por
correo (`alerta-servicio`) y push, repite el aviso cada 60 minutos mientras siga
abierto y envía la confirmación al recuperarse. Se puede disparar desde
`/admin/salud` con "Verificar ahora" o desde un cron externo del VPS:

```bash
*/5 * * * * curl -s -X POST -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  "$VITE_SUPABASE_URL/functions/v1/health-monitor" > /dev/null
```

## 6. Staging con la misma imagen de Playwright

Para regenerar las bases de screenshots del timeline con el mismo renderizado
que CI:

```bash
docker run --rm -it -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright/python:v1.55.0-jammy \
  bash -lc "npm ci && npm run build && npx vite preview --port 8080 & \
            sleep 5 && python tests/e2e/continuidad-timeline-visual.py --update"
```
