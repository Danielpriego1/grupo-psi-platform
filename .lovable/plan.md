# Fix: confirmación de solicitud de mantenimiento en producción

## Causa raíz

En `src/pages/Mantenimiento.tsx` (handler `handleSubmit`, línea 364) se hace:

```ts
supabase.from("maintenance_requests").insert({...}).select("tracking_code").single()
```

La tabla `maintenance_requests` tiene:
- Política **INSERT** pública con `WITH CHECK` de validación. ✅ permite insertar.
- Políticas **SELECT** solo para `admin` o para clientes cuyo `contact_email` coincide con `auth.jwt() ->> 'email'`.

El formulario de mantenimiento es público (usuario anónimo, sin sesión). Cuando PostgREST ejecuta el `INSERT ... RETURNING` para resolver `.select().single()`, RLS bloquea la lectura del row recién insertado y `.single()` devuelve el error `PGRST116` ("no rows"). Resultado:

- A veces el row sí queda guardado pero el cliente ve "No se pudo enviar la solicitud".
- A veces (según orden de evaluación) PostgREST aborta y la solicitud no se guarda en absoluto.

Esto explica por qué no hay registros nuevos desde el 16-may y el toast rojo del screenshot.

Además el handler no tiene `try/catch` ni `console.error`, por eso el error real no aparece en consola.

## Cambios (solo el flujo de envío)

### 1. Migración: RPC `create_maintenance_request`

Función `SECURITY DEFINER` que recibe los campos del formulario, inserta y devuelve `tracking_code`. Así no dependemos de RLS para la lectura del retorno, y mantenemos la tabla protegida.

- Mismas validaciones que el `WITH CHECK` actual (nombre, teléfono, email, notas ≤ 5000).
- `GRANT EXECUTE ... TO anon, authenticated`.
- `SET search_path = public`.

### 2. `src/pages/Mantenimiento.tsx` — solo `handleSubmit`

- Reemplazar el `.from("maintenance_requests").insert(...).select().single()` por `supabase.rpc("create_maintenance_request", { ... })`.
- Envolver en `try/catch`, hacer `console.error("maintenance submit error", error)` y mostrar el toast actual.
- No tocar pasos previos del formulario, validaciones, ni UI.

## Verificación

- Probar en preview con sesión anónima: completar pasos 1-3 → clic en "Solicitar Recolección" → debe mostrar `Step 4` con código `MNT-XXXXXX` y aparecer en `maintenance_requests`.
- Confirmar que admin sigue viendo la solicitud en `/admin/maintenance`.
- Si falla, el `console.error` deja el motivo real para diagnóstico.

## Fuera de alcance

- No se modifica ningún otro paso del formulario, mapas, validaciones de campo, ni otras rutas.
