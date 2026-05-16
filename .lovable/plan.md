# Plan: Autenticación completa + Roles + RLS

## Nota importante sobre proveedores OAuth

Lovable Cloud soporta de forma nativa **Email/Password, Google y Apple**. **GitHub no está soportado nativamente** en Lovable Cloud. Opciones:

1. **Recomendado:** Implementar Email + Google + Apple ahora, y dejar GitHub fuera (la mayoría de plataformas B2B industriales como Grupo Psi no lo necesitan).
2. Si GitHub es indispensable, hay que migrar a una integración directa con Supabase externa (proceso aparte).

Procederé con **opción 1** salvo que indiques lo contrario.

## Fase 1 — Supabase Auth & esquema

- `configure_auth`: signup habilitado, `auto_confirm_email=false` (verificación por email), HIBP activado.
- `configure_social_auth`: habilitar `google` y `apple` (managed, sin credenciales propias).
- Trigger `on_auth_user_created` ya existe (`handle_new_user`) → verificar que crea `profiles` y asigna rol por defecto `client`.
- Enum `app_role` actual: `admin`, `vendor`. **Migración:** agregar `'tecnico'` y `'client'` al enum (manteniendo `vendor` por compatibilidad con código existente que la usa).
- Trigger nuevo: al crear profile, insertar `(user_id, 'client')` en `user_roles` por defecto.
- Tabla `clients`: agregar columna opcional `user_id uuid` para vincular cuenta auth ↔ registro de cliente (matching por email también soportado como hoy).
- Tabla `appointments` y `maintenance_requests`: ya tienen `assigned_to` para técnicos (perfecto para RLS).

## Fase 2 — RLS endurecidas (estrategia por rol)

Función helper nueva `public.is_admin()` y `public.is_tecnico()` (wrappers de `has_role`) para legibilidad.

| Tabla | Admin | Técnico | Cliente |
|---|---|---|---|
| `profiles` | todo | propio | propio |
| `user_roles` | todo | leer propio | leer propio |
| `clients` | todo | leer asignados | leer propio (`user_id = auth.uid()` o email match) |
| `orders` | todo | leer asignados (`assigned_to`) | leer propios (vía `client_id` → `clients.user_id`) |
| `order_items` | todo | leer si order asignado | leer si order propio |
| `appointments` | todo | leer/actualizar asignados | leer propios |
| `maintenance_requests` | todo | leer asignadas (futuro: añadir `assigned_to`) | leer por email/tracking |
| `deliveries` | todo | leer asignados | leer si order propio |
| `certificates` | todo | leer relacionados | leer propios |
| `equipment` | todo | leer asignados | leer propios |
| `certificate_copy_requests` | todo | — | propios (ya está) |
| `inventory` | admin gestiona | leer | leer público (mantengo) |

Se eliminan las políticas actuales tipo `"Authenticated users can view X" USING true` que son demasiado abiertas, y se reemplazan por las anteriores.

## Fase 3 — Frontend

Páginas nuevas/actualizadas en `src/pages/auth/`:
- `Login.tsx`: email/password + botones OAuth (Google, Apple) con logos oficiales SVG.
- `Register.tsx`: email/password + OAuth, acepta términos.
- `ForgotPassword.tsx`: envía email con `resetPasswordForEmail`.
- `ResetPassword.tsx`: pública, detecta `type=recovery`, actualiza password.
- `Callback.tsx`: maneja redirect OAuth.

Componentes:
- `src/components/auth/AuthLayout.tsx`: layout limpio, branding Grupo Psi, dark mode.
- `src/components/auth/OAuthButtons.tsx`: botones con logos.
- `src/components/auth/ProtectedRoute.tsx`: ya existe → extender con prop `requiredRole`.
- `src/hooks/useAuth.tsx`: ya existe → añadir `roles`, `isAdmin`, `isTecnico`, `isClient`, `signOut`.

Protección de rutas en `App.tsx`:
- `/admin/*` → `requiredRole="admin"`
- `/tecnico/*` (nuevo dashboard básico) → `requiredRole="tecnico"`
- `/portal/*` → autenticado (cualquier rol)

## Fase 4 — Legal

Actualizar `src/pages/Privacidad.tsx` y `src/pages/Terminos.tsx`:
- Sección "Autenticación y datos OAuth" (Google/Apple, qué datos se reciben).
- Sección "Sesiones y cookies".
- Sección "Roles y permisos".
- Sección "Retención de datos" (90 días tras eliminación de cuenta).

## Entregables (orden de ejecución)

1. `supabase--migration` con: enum `app_role` ampliado, helpers RLS, `clients.user_id`, nuevas políticas en todas las tablas, trigger de rol por defecto.
2. `configure_auth` + `configure_social_auth` (google, apple).
3. Implementación frontend (auth pages, OAuthButtons, ProtectedRoute con roles, useAuth ampliado).
4. Actualización Privacidad/Términos.
5. Verificación de rutas existentes (admin, portal) para que sigan funcionando.

¿Confirmas que procedo **sin GitHub** (solo Email + Google + Apple)?
