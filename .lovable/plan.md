- Problema

En `/mantenimiento`, al tocar una tarjeta de servicio (Extintores, Compresores, etc.):

La página **no hace scroll** al panel de detalles, así que en móvil parece que no pasa nada.

- Al terminar de leer los detalles **no hay forma rápida de volver** al servico solicitado

## Cambios (solo `src/pages/Mantenimiento.tsx`)

### 1. Auto-scroll al abrir un servicio

- Añadir `id="service-detail"` a la `<section>` del detalle expandido (línea ~599).
- En `toggleService(id)`, tras expandir un servicio:
  ```ts
  setTimeout(() => {
    document.getElementById("service-detail")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
  ```
- Si el usuario toca la misma tarjeta para **cerrar**, hacer auto-scroll a la ficha de servicio que seleccionó (`id="servicio-${id}"` en cada `<button>`).

### 2. Botón "Volver a servicios"

- Añadir un botón tipo `ghost` dentro de la tarjeta de detalle (debajo de la descripción o junto a los CTA).
- Al hacer click:
  - `setExpandedService(null)`
  - Luego `scrollIntoView({ behavior: "smooth", block: "start" })` hacia el contenedor del grid (`id="servicios-grid"`).

### 3. Identificadores para navegación

- Añadir `id="servicios-grid"` al `<div className="grid ...">` de las tarjetas para que el scroll de regreso las posicione correctamente debajo del header sticky.

## No se modifica

- Contenido de los servicios, flujo de agendamiento, ni lógica de cotización.