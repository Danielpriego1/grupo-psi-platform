## Objetivo
Cuando Sora cierra una venta, mostrar dentro del chat una tarjeta visual con: número de orden, líneas del pedido, total con IVA, y un botón naranja grande que abra Stripe Checkout en una nueva pestaña.

Hoy la respuesta ya genera `checkout_url`, `order_number` y `total` desde `sora-chat`, pero en el chat sólo aparece un pequeño pill markdown. Vamos a renderizar una tarjeta dedicada.

## Cambios

### 1. `supabase/functions/sora-chat/index.ts`
- Quitar el bloque markdown `[Paga seguro aquí…](url)` del `reply` para evitar duplicar el botón.
- Adjuntar al texto un marcador estructurado al final del mensaje:
  `\n\n<!--ORDER:{"order_number":"SOR-…","total":1234.56,"url":"https://checkout.stripe.com/…","items":[{"name":"…","quantity":2,"unit_amount_mxn":500}]}-->`
- Seguir devolviendo `checkout_url`, `order_number`, `total` en el JSON (sin cambios).

### 2. `src/components/ChatWidget.tsx`
- Extender `Message` con `order?: { order_number, total, url, items }`.
- Al recibir la respuesta del edge, si trae `checkout_url`, parsear el marcador `<!--ORDER:…-->`, removerlo del `content`, y guardar el objeto en `msg.order`.
- En `MessageBubble`, si `msg.order` existe, renderizar bajo el texto una tarjeta:
  - Encabezado: "Resumen de tu pedido" + chip con `order_number`.
  - Lista de items: `qty × nombre` … `$subtotal`.
  - Separador y fila **Total $X MXN (IVA incluido)**.
  - Botón `<a>` grande, full-width, color naranja (`bg-[#ea580c] hover:bg-[#c2410c]`), texto blanco semibold, ícono de candado/tarjeta, `target="_blank" rel="noopener noreferrer"` apuntando a la URL de Stripe. Texto: "Pagar ahora con tarjeta — $X MXN".
  - Pie pequeño: "Pago seguro procesado por Stripe".
- Estilo coherente con la burbuja del asistente (fondo `bg-white/10` con borde, esquinas redondeadas).

### Notas técnicas
- El marcador HTML-comentario es ignorado por `renderMarkdown` (ya filtramos antes de renderizar), así no se ve en el texto.
- Mantener el link markdown como fallback solo si el parseo falla.
- No tocar `sora-checkout` ni el esquema de DB.

## Archivos
- `supabase/functions/sora-chat/index.ts` (editar formato del reply)
- `src/components/ChatWidget.tsx` (parsear marcador + tarjeta + botón)
