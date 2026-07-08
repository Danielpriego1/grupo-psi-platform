import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { items, total, clientName = 'Sin nombre', clientPhone = 'Sin teléfono' } = await req.json();

    // Generate order number
    const orderNumber = `COT-${Date.now()}`;

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        total: total,
        notes: clientName ? `Cotización de: ${clientName}${clientPhone ? ` — Tel: ${clientPhone}` : ""}` : "Cotización vía carrito",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = items.map((item: {
      product: { id: string; name: string; priceOriginalMxn: number; discount: number | null };
      quantity: number;
      selectedSize?: string;
      selectedVariant?: string;
    }) => {
      const basePrice = item.product.priceOriginalMxn;
      const unitPrice = item.product.discount
        ? basePrice * (1 - item.product.discount)
        : basePrice;
      const productName = [
        item.product.name,
        item.selectedSize ? `Talla: ${item.selectedSize}` : null,
        item.selectedVariant ? `Variante: ${item.selectedVariant}` : null,
      ]
        .filter(Boolean)
        .join(" — ");

      return {
        order_id: order.id,
        product_id: item.product.id,
        product_name: productName,
        quantity: item.quantity,
        unit_price: unitPrice,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Notificar al equipo comercial (no bloquea la respuesta al cliente)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const fmt = (n: number) =>
        `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          templateName: "nueva-cotizacion",
          idempotencyKey: `quote-${orderNumber}`,
          templateData: {
            orderNumber,
            total: fmt(Number(total || 0)),
            currency: "MXN",
            clientName: clientName || "Sin nombre",
            clientPhone: clientPhone || "Sin teléfono",
            createdAt: new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
            items: orderItems.map((it: any) => ({
              name: it.product_name,
              qty: it.quantity,
              price: fmt(Number(it.unit_price || 0)),
            })),
          },
        }),
      }).catch((e) => console.warn("notify quote email failed", e));
    } catch (notifyErr) {
      console.warn("notify quote email exception", notifyErr);
    }

    return new Response(
      JSON.stringify({ success: true, orderNumber }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const message = error?.message || JSON.stringify(error);
    console.error("create-quote-order error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
