# Nueva sección "Continuidad Operativa" en Home + reordenamiento

## Objetivo
Reposicionar el Home de Grupo PSI para que, inmediatamente después del Hero, el usuario entienda que la empresa administra el ciclo de vida de equipos críticos ("No damos mantenimiento a equipos. Administramos la continuidad operativa de nuestros clientes."), y luego descubra servicios y catálogo.

## Jerarquía final del Home

```text
Hero (sin cambios)
↓
Continuidad Operativa (nueva sección)
↓
Servicios (sección existente, se mueve antes del catálogo)
↓
Catálogo (sección existente)
↓
Marcas (BrandsTicker, sección existente)
↓
AboutSection, CustomerStories, CoverageMap, CTASection (sin cambios)
```

## Cambios planeados

### 1. Nuevo componente `src/components/ContinuidadOperativaSection.tsx`

Componente 100% desacoplado, reutilizable para futura página `/servicio-administrativo`.

#### Estructura
- **Badge** "Nuevo" con estilo de chip existente (`vps-chip-primary` / badge shadcn).
- **Título**: "No damos mantenimiento a equipos." en color de texto base.
- **Segunda línea del título**: "Administramos la continuidad operativa de nuestros clientes." en color primario (`text-primary glow-text`).
- **Subtítulo**: "Con nuestro Servicio Administrativo y Personalizado gestionamos el ciclo de vida completo de sus equipos críticos para reducir tiempos muertos, eliminar carga administrativa y mantener la trazabilidad completa de cada activo."
- **Grid 2x2 de beneficios** (responsive, 1 columna en móvil, 2 en tablet+):
  1. 📅 Agenda inteligente — Programación de mantenimientos.
  2. 🚚 Recolección programada — Coordinación logística sin llamadas.
  3. 📂 Expedientes digitales — Historial completo por equipo.
  4. 🛡️ Certificaciones y trazabilidad — Control documental permanente.
  - Cada tarjeta reutiliza el estilo de tarjeta de `ServicesSection` (`bg-white/5 border-white/10 hover:border-primary/40 hover:-translate-y-2`, icono en círculo primario).
  - Hover: leve elevación + borde primario + glow sutil (solo CSS, sin Framer Motion).
- **Línea de tiempo conectada** (5 nodos):
  - Nodos: Alta del activo → Agenda inteligente → Recolección → Servicio y certificación → Entrega y seguimiento.
  - Línea continua horizontal con conector iluminado (`bg-gradient-to-r` + `box-shadow` con `hsl(var(--primary) / ...)`).
  - Cada nodo se ilumina al entrar en viewport usando `IntersectionObserver` nativo y clases de utilidad existentes (`glow-primary`, `animate-pulse-glow` o similar).
  - La línea reutiliza el lenguaje de energía del Hero: gradiente primario, blur y sombras luminosas.
- **Tarjetas inferiores** (3 columnas responsive):
  1. 🤖 Asistente 24/7 — Resuelve dudas y guía cada solicitud.
  2. 💻 Videollamadas técnicas — Atención especializada cuando se necesita.
  3. ⏱ Seguimiento continuo — Siempre sabrá dónde está su equipo.
- **CTA**: botón principal "Conozca nuestro Servicio Administrativo y Personalizado".
  - No se crea página nueva.
  - Anchor interno `#servicio-administrativo` dentro de la misma sección (scroll suave nativo).

#### Transición visual desde el Hero
- Al finalizar el scroll hacia la nueva sección, se presenta la frase:
  - "De equipos aislados a una operación siempre visible."
- La sección usa fondo oscuro continuo (`bg-black` o `bg-background`) para que las líneas de energía del Hero se perciban como una extensión del sistema.
- Se añaden elementos decorativos sutiles (líneas/blurs primarios) que evocan continuidad sin romper el Hero.

### 2. Reordenamiento en `src/pages/Index.tsx`

Solo se reordenan los componentes existentes:

```text
<HeroSection ... />
<ContinuidadOperativaSection />
<ServicesSection />
<main ref={catalogRef}>...</main>   {/* Catálogo */}
<BrandsTicker />
<AboutSection />
<CustomerStories />
<CoverageMap />
<CTASection />
```

No se modifica el contenido interno de `HeroSection`, `ServicesSection`, `BrandsTicker`, `AboutSection`, `CustomerStories`, `CoverageMap` ni `CTASection`.

### 3. Estilo y animaciones

- **Sin nuevas dependencias**: no se instala Framer Motion ni otras librerías para esta sección.
- **Animaciones permitidas**: CSS nativo, keyframes existentes en `tailwind.config.ts` (`fade-in`, `slide-up`, `glow-pulse`, `float`, etc.) y `IntersectionObserver` para triggers de scroll.
- **Tokens existentes**: se usan `bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, `glow-text`, `glow-primary`, `glass`, `vps-chip-primary`, etc.
- **Performance**: animaciones limitadas a transform/opacity; sin layout thrashing.

### 4. Accesibilidad

- Uso semántico de `<section>` con `aria-labelledby` vinculado al título.
- Línea de tiempo con `role="list"` y nodos con `role="listitem"`.
- Swatches/CTA con estados focus visibles (`focus-visible:ring-2 focus-visible:ring-ring`).
- Animaciones respetan `prefers-reduced-motion` (se desactivan o simplifican con media query).

### 5. Verificación

- `tsgo` para validación de tipos.
- `vitest run` para asegurar que no se rompen tests existentes.
- Revisión visual en preview (mobile y desktop) para confirmar:
  - Orden correcto de secciones.
  - La nueva sección no rompe espaciado ni jerarquía.
  - Las líneas de energía del Hero se sienten continuas.
  - Los nodos de la línea de tiempo se iluminan al hacer scroll.

## Commit propuesto

```text
feat(home): add premium Continuidad Operativa section
```

## Checklist de no-regresión

- [ ] Hero intacto (intro, video, stats, categorías).
- [ ] Servicios se renderiza y carga datos de Supabase como antes.
- [ ] Catálogo conserva su scroll target y animaciones.
- [ ] Marcas, About, Testimonios, Mapa y CTA no cambian.
- [ ] Rutas y navegación sin cambios.
- [ ] No se añaden dependencias nuevas.
