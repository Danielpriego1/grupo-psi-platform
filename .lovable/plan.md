## Rediseño del Dashboard /admin — "Luminous Bento Admin"

Convertir el dashboard de un layout vertical oscuro a un **bento grid claro y luminoso** con sensación de tiempo real: contadores animados, pulsos al recibir datos nuevos, feed live lateral y micro-interacciones en cada widget. El sidebar no cambia.

### Decisiones de diseño (fijas)

- **Paleta clara**: fondo `#f8fafc`, superficies blancas con bordes `slate-200/60` y sombras suaves; acento principal **indigo** (`#4f46e5`); acentos secundarios ámbar/rosa/esmeralda.
- **Tipografía**: Space Grotesk (headings) + DM Sans (body) vía `@fontsource`.
- **Layout**: bento grid de 4 columnas con celdas asimétricas (KPI hero 2x1, mapa 2x2, feed 1x2, calendario 2x1, etc.) y esquinas grandes (rounded-3xl/40px).
- **Modo claro forzado solo en /admin** — el resto del sitio mantiene el dark mode actual.

### Estructura visual (bento)

```text
┌─────────────────────┬──────────┬──────────┐
│ HERO Ingresos Mes   │ Pedidos  │          │
│ + sparkline +delta  │ Hoy      │          │
├──────────┬──────────┤──────────┤  ACTIV.  │
│          │          │ Pendient │  LIVE    │
│   MAPA   │   MAPA   │          │  FEED    │
│ Tabasco  │  Tabasco ├──────────┤  (1x2)   │
│          │          │ Completd │          │
├──────────┴──────────┼──────────┼──────────┤
│ Agenda mes (2x1)    │ Donut    │ Barras   │
│                     │ Estados  │ Mtto     │
└─────────────────────┴──────────┴──────────┘
```

Todos los widgets actuales se conservan: 4 KPIs, chart ingresos (embebido como sparkline del hero), donut pedidos por estado, barras mantenimientos, mapa Leaflet, calendario y tabla de pedidos recientes (movida abajo).

### Interactividad / tiempo real

- **Live indicator**: badge "EN VIVO" con dot pulsante en el header, conectado al estado del canal Supabase Realtime.
- **Count-up** en KPIs cuando cambia el valor (tween 600ms).
- **Pulse glow** (ring indigo 600ms) en la celda que recibió update.
- **Feed Realtime lateral**: nueva celda que suscribe a `orders`, `payments`, `maintenance_requests` y `crm_activities`; cada evento entra con `animate-slide-in-right + fade-in`, timestamp relativo auto-actualizado cada 30s ("hace 2s", "hace 4m").
- Hover en bento cells: ligero `border-indigo-200` + sombra más marcada.

### Cambios técnicos

**Nuevos archivos:**
- `src/components/admin/dashboard/BentoCard.tsx` — wrapper genérico con variantes de tamaño y prop `pulse` para el glow.
- `src/components/admin/dashboard/HeroRevenueCard.tsx` — KPI grande con sparkline (Recharts AreaChart) y delta.
- `src/components/admin/dashboard/KpiTile.tsx` — KPI compacto con icono, count-up y sub-label.
- `src/components/admin/dashboard/LiveActivityFeed.tsx` — feed realtime; consume `orders`, `payments`, `maintenance_requests`, `crm_activities` vía `useRealtimeTable`; renderiza últimos 20 eventos con timestamps relativos.
- `src/components/admin/dashboard/DonutStatus.tsx` y `BarMaintenance.tsx` — variantes claras compactas de los charts (Recharts) con colores indigo/ámbar/esmeralda.
- `src/components/admin/dashboard/CompactCalendar.tsx` — vista de mes minimal con dots por día; al click, expande a la vista actual `react-big-calendar` en modal.
- `src/hooks/useCountUp.ts` — tween numérico.
- `src/hooks/useRelativeTime.ts` — formatter "hace Xs" con tick cada 30s.

**Editados:**
- `src/pages/admin/AdminDashboard.tsx` — recompone con bento grid; envuelve en `<div className="admin-light bg-slate-50 ...">` para forzar la paleta clara solo aquí. Agrega query para feed inicial (últimos 20 eventos combinados) y pasa `pulse` flags cuando entran nuevos datos.
- `src/components/admin/dashboard/DashboardCharts.tsx` — refactor a 3 componentes individuales (donut, barras, hero sparkline) reutilizando datos existentes.
- `src/components/admin/dashboard/PendingOrdersMap.tsx` — tile estilo claro: leyenda flotante glass blanca, sin marco oscuro.
- `src/components/admin/dashboard/RecentOrdersTable.tsx` — adapta a fondo blanco/slate.
- `tailwind.config.ts` — añade `fontFamily.display: ['Space Grotesk', ...]` y `fontFamily.sans: ['DM Sans', ...]` solo dentro de un selector scope `.admin-light` (vía plugin) o se aplica con clases directas en los componentes.
- `src/main.tsx` — importa `@fontsource/space-grotesk/{400,500,700}.css` y `@fontsource/dm-sans/{400,500,700}.css`.
- `package.json` — `bun add @fontsource/space-grotesk @fontsource/dm-sans`.

**Sin cambios de backend / migraciones / RLS.** Todo se construye sobre las tablas y suscripciones realtime ya existentes.

### Fuera de alcance

- Sidebar admin (queda igual).
- Otras páginas /admin/* (mantienen su estilo actual).
- Lógica de negocio, edge functions, autenticación o permisos.

Used the Redesign skill.