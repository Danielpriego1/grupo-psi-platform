# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Variables de Entorno

`.env` **no se commitea** (está en `.gitignore`). Cada máquina que compile el proyecto necesita
su propio `.env` en la raíz con estas tres variables:

```sh
VITE_SUPABASE_PROJECT_ID="<project-ref>"
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
```

Vite solo expone al browser las variables con prefijo `VITE_`. La publishable key es pública por
diseño; lo que protege los datos son las políticas RLS de Supabase, no el secreto de la key.
Nunca pongas la `service_role` key en este archivo.

Si el build se hace sin `.env`, la app arranca con la URL de Supabase en `undefined` y falla en
runtime. Verificá que exista antes de compilar.

## Keep-Alive (Anti-Pausa Supabase)

Para evitar que el proyecto de Supabase entre en pausa por inactividad (7 días en el plan free),
el script `scripts/keep-alive.sh` consulta la base y el servicio de auth.

No tiene credenciales propias: lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` del `.env`
de la raíz del proyecto. Verifica `GET /rest/v1/clients?select=id&limit=1` (toca Postgres real) y
`GET /auth/v1/health`, y sale con código 1 si alguno falla.

### Instalación en VPS

```sh
chmod +x /ruta/al/proyecto/scripts/keep-alive.sh
mkdir -p ~/logs

crontab -e
# Lunes y jueves a las 03:00 (máximo 4 días sin ping, contra el límite de 7):
0 3 * * 1,4 /ruta/al/proyecto/scripts/keep-alive.sh >> ~/logs/supabase-keepalive.log 2>&1
```

### Verificar

```sh
tail -20 ~/logs/supabase-keepalive.log
# Esperado: 2026-10-24T13:38:55+02:00 - OK: db=200 auth=200
```

## Healthcheck del Sitio (Uptime)

El script `scripts/healthcheck.sh` sondea la superficie pública del sitio (grupopsi.com,
www, /contacto) y la expiración del certificado TLS. Alerta **solo al cambiar de estado**
(en un outage de horas no spamea un mensaje por corrida).

**Alcance honesto**: corre en la misma VPS que monitorea, así que detecta un deploy
roto, el contenedor de Caddy parado, o un certificado expirando. **No puede detectar
una VPS muerta**; eso requiere un monitor externo (por ejemplo UptimeRobot gratis).

La configuración vive fuera del repo: `~/.config/grupopsi-health/config`, con el
nombre del topic de ntfy.sh. Suscribite al topic con la [app ntfy](https://ntfy.sh)
para recibir las alertas en el iPhone.

### Instalación en VPS

```sh
chmod +x /ruta/al/proyecto/scripts/healthcheck.sh
mkdir -p ~/logs ~/.config/grupopsi-health
echo 'NTFY_TOPIC="grupopsi-<tu-id-secreto>"' > ~/.config/grupopsi-health/config
chmod 600 ~/.config/grupopsi-health/config

crontab -e
# Cada 5 minutos; log solo en transiciones:
*/5 * * * * /ruta/al/proyecto/scripts/healthcheck.sh >> ~/logs/grupopsi-health.log 2>&1
```

### Verificar

```sh
tail -20 ~/logs/grupopsi-health.log
# Esperado en un outage: 2026-10-24T15:00:01+02:00 DOWN https://www.grupopsi.com/ returned HTTP 503
```

# test deploy automatico
