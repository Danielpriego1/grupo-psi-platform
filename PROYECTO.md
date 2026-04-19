# Grupo Psi — Proyectos Digitales

**Empresa**: Grupo Psi / Brexon Services
**GitHub**: danielpriego1
**Email**: priego.psi@gmail.com

---

## Arquitectura General

    grupopsi.com (Web)          grupo-psi-app (Movil)
          |                              |
       Vite + React               Expo + React Native
          |                              |
             Supabase Cloud
          Web: faadsipcsecmulwhbjah
          App: gchaoyqlkjtdkkgyawpg
                         |
                VPS Contabo 147.93.138.51
                         |
                       Nginx

---

# PROYECTO 1: grupo-psi-platform (Web)

**URL**: https://grupopsi.com
**Repo**: https://github.com/Danielpriego1/grupo-psi-platform
**Stack**: Vite + React + TypeScript + shadcn/ui + Tailwind CSS
**Supabase**: faadsipcsecmulwhbjah
**Hosting**: VPS Contabo — Nginx desde /var/www/grupopsi
**SSL**: Certbot (Let's Encrypt)

## Infraestructura Web

| Componente | Detalle |
|---|---|
| VPS | Ubuntu 24.04 — 147.93.138.51 |
| Usuario VPS | dani |
| Nginx config | /etc/nginx/sites-available/grupopsi.com |
| Build dir | /home/dani/grupo-psi-platform/dist |
| Deploy dir | /var/www/grupopsi |

## Deploy Manual Web

    cd ~/grupo-psi-platform
    git pull origin main
    npm run build
    sudo rsync -av --delete dist/ /var/www/grupopsi/
    sudo chown -R www-data:www-data /var/www/grupopsi
    sudo systemctl reload nginx

## Historial Web

### Abril 14, 2026
- Primer deploy exitoso en VPS
- Nginx configurado para grupopsi.com
- SSL con Certbot (HTTPS)
- Fix: eliminado symlink default de Nginx
- Fix: archivos dist vacios, cambiado cp por rsync
- Permisos correctos www-data en /var/www/grupopsi

### Abril 17, 2026
- Fix HeroSection.tsx: video intro con pantalla negra
  Causa: object-contain pt-16
  Fix: cambiado a object-cover (linea 46)
- Build exitoso 9.49s, 3028 modulos

### Abril 19, 2026
- Acceso remoto SSH via tunel reverso (autossh + launchd)
  Blink: 147.93.138.51:22220
- Acceso remoto VNC via tunel reverso
  RVNC Viewer: 147.93.138.51:59000
- En progreso: deploy automatico con GitHub Webhook

## Bugs Arreglados Web

| Bug | Archivo | Fix | Fecha |
|---|---|---|---|
| Video intro negro | HeroSection.tsx L46 | object-contain a object-cover | Abr 17 |
| Nginx servia pagina default | sites-enabled | Eliminado symlink default | Abr 14 |
| Dist vacio en /var/www | Deploy manual | cp a rsync | Abr 14 |

## Bugs Pendientes Web

| # | Bug | Componente | Prioridad |
|---|---|---|---|
| 1 | Chatbot Sora repite texto | SoraSection | Alta |
| 2 | Sora da informacion incorrecta | Prompt del chatbot | Alta |
| 3 | Imagen de Sora estatica (deberia ser video) | SoraSection | Media |
| 4 | Video intro no reproduce en Safari/iOS | HeroSection.tsx | Media |

## Pendientes Web

- Deploy automatico GitHub Webhook (en progreso)
- Arreglar chatbot Sora
- Revisar video en Safari/iOS
- Cron renovacion SSL (certbot renew)
- Notificaciones iPhone si nginx se cae (ntfy.sh)

---

# PROYECTO 2: grupo-psi-app (App Movil)

**Repo**: https://github.com/Danielpriego1/grupo-psi-app
**Stack**: Expo + React Native + TypeScript + NativeWind
**Supabase**: gchaoyqlkjtdkkgyawpg
**Destino**: Solo para clientes de Grupo Psi
**Origen**: Desarrollada con Manus, continuada con Comet

## Variables de Entorno App

    EXPO_PUBLIC_SUPABASE_URL=https://gchaoyqlkjtdkkgyawpg.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OMvbrNBRq42dNp6gklkQxA_CR7m7Mvy

## Tablas Supabase App

| Tabla | Estado | Descripcion |
|---|---|---|
| profiles | OK | Perfiles de usuario |
| user_roles | OK | Roles de usuario |
| clients | OK | Clientes |
| orders | OK | Pedidos |
| order_items | OK | Detalle de pedidos |
| deliveries | OK | Entregas |
| inventory | OK | 127 productos |
| cart | OK | Carrito de compras |
| cart_items | OK | Items del carrito |
| maintenance_requests | OK | Solicitudes de mantenimiento |
| schedules | OK | Agendamiento de visitas |
| locations | OK | Ubicaciones de entrega |
| products | OK | Catalogo sincronizado con inventory |

## Historial App

### Abril 6-7, 2026
- Repo grupo-psi-app creado en GitHub
- Stack: Expo + React Native + TypeScript + NativeWind
- Supabase conectado a gchaoyqlkjtdkkgyawpg
- lib/supabase.ts configurado con EXPO_PUBLIC variables
- .env creado con variables correctas
- Esquema de Manus revisado e implementado
- Tablas faltantes creadas: cart, cart_items, maintenance_requests,
  schedules, locations, products
- Git configurado: priego.psi@gmail.com / Daniel Priego
- Commit y push exitoso a main

## Bugs Pendientes App

| # | Bug | Estado | Prioridad |
|---|---|---|---|
| 1 | APK no generado (EAS Build pendiente) | Pendiente | Alta |
| 2 | Verificar .env apunta a gchaoyqlkjtdkkgyawpg | Pendiente | Alta |
| 3 | Queries contra tablas sin verificar en prod | Pendiente | Media |
| 4 | Auth Email/Password sin validar | Pendiente | Media |
| 5 | Sincronizacion products con inventory web | Pendiente | Baja |

## Pendientes App

- Generar APK con EAS Build
- Verificar .env apunta a gchaoyqlkjtdkkgyawpg
- Probar cada pantalla contra Supabase
- Validar flujo de auth Email/Password
- Probar carrito completo
- Probar solicitud de mantenimiento
- Probar agendamiento de cita
- Publicar en Play Store (cuenta Google Developer $25)
- Publicar en App Store (Apple Developer $99/anio)

---

# Infraestructura Compartida

## Acceso Remoto iMac

| Tipo | App | Direccion | Puerto |
|---|---|---|---|
| SSH | Blink | 147.93.138.51 | 22220 |
| VNC Escritorio | RVNC Viewer | 147.93.138.51 | 59000 |
| VPS directo | Cualquier SSH | 147.93.138.51 | 22 |

## SSH Config Mac

    Host vps
        HostName 147.93.138.51
        User dani
        Port 22
        IdentityFile ~/.ssh/id_ed25519

    Host imac-remoto
        HostName 147.93.138.51
        User danielpriegovillegas
        Port 22220
        IdentityFile ~/.ssh/id_ed25519

## Cron Jobs VPS

| Job | Schedule | Descripcion |
|---|---|---|
| keep-alive.sh | Lunes y Jueves 00:00 | Evita que Supabase se pause |

---

# Proximos Pasos (Orden Recomendado)

1. Deploy automatico GitHub Webhook (web)
2. Arreglar chatbot Sora en la web
3. Generar APK de la app con EAS Build
4. Probar todas las pantallas de la app contra Supabase
5. Renovacion automatica SSL con cron
6. Notificaciones si nginx se cae
