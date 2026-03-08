import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { products, Product } from "@/data/products";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "¡Hola! 👋 Soy Sora, asistente de Grupo PSI. Pregúntame sobre productos, precios, tallas o disponibilidad. También puedo ayudarte a encontrar lo que necesitas.",
  },
];

function searchProducts(query: string): Product[] {
  const lower = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
}

function formatPrice(p: Product): string {
  const final = p.discount ? p.priceOriginalMxn * (1 - p.discount) : p.priceOriginalMxn;
  const discountText = p.discount ? ` (${(p.discount * 100).toFixed(0)}% desc.)` : "";
  return `$${final.toFixed(2)} MXN${discountText}`;
}

function getSmartResponse(input: string): string {
  const lower = input.toLowerCase();

  // Price queries
  if (lower.includes("precio") || lower.includes("cuánto") || lower.includes("cuanto") || lower.includes("costo")) {
    const matches = searchProducts(input.replace(/precio|cuánto|cuanto|cuesta|costo|de|el|la|los|las|del/gi, "").trim());
    if (matches.length > 0 && matches.length <= 5) {
      return matches
        .map((p) => `• **${p.name}**: ${formatPrice(p)}${p.inStock ? "" : " ⚠️ Agotado"}`)
        .join("\n");
    }
    if (matches.length > 5) {
      return `Encontré ${matches.length} productos. ¿Podrías ser más específico? Por ejemplo: "precio extintor 6 kg" o "precio overol supervisor".`;
    }
  }

  // Stock queries
  if (lower.includes("disponible") || lower.includes("stock") || lower.includes("hay") || lower.includes("tienen")) {
    const matches = searchProducts(input.replace(/disponible|stock|hay|tienen|de|el|la|los|las/gi, "").trim());
    if (matches.length > 0) {
      return matches
        .slice(0, 6)
        .map((p) => `• ${p.name}: ${p.inStock ? "✅ Disponible" : "❌ Agotado"}${p.purchaseStatus === "Pre-Order" ? " (Pre-orden)" : ""}`)
        .join("\n");
    }
  }

  // Size queries
  if (lower.includes("talla") || lower.includes("medida") || lower.includes("tamaño")) {
    const matches = searchProducts(input.replace(/talla|medida|tamaño|de|el|la|los|las|del|que/gi, "").trim());
    const withSizes = matches.filter((p) => p.sizes);
    if (withSizes.length > 0) {
      return withSizes
        .slice(0, 4)
        .map((p) => {
          const sizes = Object.values(p.sizes!).flat().join(", ");
          return `• **${p.name}**: ${sizes}`;
        })
        .join("\n");
    }
    return "Los productos con tallas incluyen overoles, playeras y calzado. ¿Cuál te interesa?";
  }

  // Category browsing
  if (lower.includes("categoría") || lower.includes("categoria") || lower.includes("qué venden") || lower.includes("que venden") || lower.includes("catálogo")) {
    const cats = [...new Set(products.map((p) => p.category))];
    const summary = cats.map((c) => {
      const count = products.filter((p) => p.category === c).length;
      return `• **${c}** (${count} productos)`;
    });
    return `Tenemos estas categorías:\n${summary.join("\n")}\n\n¿Sobre cuál quieres saber más?`;
  }

  // Specific product categories
  const categoryMap: Record<string, string> = {
    extintor: "Extintores",
    overol: "Overoles",
    playera: "Uniformes",
    polo: "Uniformes",
    sudadera: "Uniformes",
    bota: "Protección pies",
    calzado: "Protección pies",
    casco: "EPP",
    guante: "EPP",
    lente: "EPP",
    chaleco: "EPP",
  };

  for (const [key, cat] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      const catProducts = products.filter((p) => p.category === cat);
      if (catProducts.length <= 8) {
        return catProducts
          .map((p) => `• **${p.name}** — ${p.priceOriginalMxn > 0 ? formatPrice(p) : "Próximamente"}${p.inStock ? "" : " (Agotado)"}`)
          .join("\n");
      }
      return `Tenemos ${catProducts.length} productos en ${cat}. Los más populares:\n${catProducts.slice(0, 5).map((p) => `• ${p.name} — ${formatPrice(p)}`).join("\n")}\n\n¿Te interesa alguno en particular?`;
    }
  }

  // Cheapest/most expensive
  if (lower.includes("barato") || lower.includes("económico") || lower.includes("economico")) {
    const available = products.filter((p) => p.inStock && p.priceOriginalMxn > 0).sort((a, b) => a.priceOriginalMxn - b.priceOriginalMxn);
    return `Los más económicos:\n${available.slice(0, 5).map((p) => `• ${p.name} — ${formatPrice(p)}`).join("\n")}`;
  }

  // Maintenance
  if (lower.includes("mantenimiento") || lower.includes("recarga") || lower.includes("servicio")) {
    return "Ofrecemos mantenimiento y recarga de extintores y compresores. Puedes agendar desde la página del producto seleccionando fecha y ubicación en el mapa. También puedes ir a la sección de Agendar en el menú.";
  }

  // Delivery
  if (lower.includes("entrega") || lower.includes("envío") || lower.includes("envio")) {
    return "Realizamos entregas en la zona metropolitana. En la ficha del producto selecciona tipo de servicio 'Entrega', elige fecha y ubica tu dirección en el mapa.";
  }

  // Greetings
  if (lower.match(/^(hola|hey|buenas|buenos|qué tal|que tal)/)) {
    return "¡Hola! 👋 ¿En qué te puedo ayudar? Puedo buscar productos, darte precios, verificar disponibilidad o ayudarte con el proceso de compra.";
  }

  // Generic product search
  const matches = searchProducts(input);
  if (matches.length > 0 && matches.length <= 6) {
    return `Encontré esto:\n${matches.map((p) => `• **${p.name}** — ${p.priceOriginalMxn > 0 ? formatPrice(p) : "Próximamente"}`).join("\n")}\n\n¿Te interesa alguno? Puedes verlo en detalle desde el catálogo.`;
  }

  return "No encontré un producto específico. Puedo ayudarte con:\n• Precios (ej: \"precio extintor 6 kg\")\n• Disponibilidad (ej: \"hay overoles?\")\n• Tallas (ej: \"tallas de playera polo\")\n• Categorías (ej: \"qué extintores tienen?\")\n\n¿Qué necesitas?";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getSmartResponse(userMsg.content);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-[72px] w-[72px] rounded-full shadow-2xl transition-all duration-500 overflow-hidden",
          "animate-glow-pulse hover:scale-110",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <video src="/videos/sora.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[370px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl",
          "max-h-[540px] transition-all duration-400",
          open ? "animate-scale-in opacity-100" : "scale-90 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative flex items-center gap-3 overflow-hidden px-4 py-3">
          <video src="/videos/sora-2.mp4" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover brightness-50" />
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30">
              <video src="/videos/sora.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Sora · Grupo PSI</div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce-soft" />
                En línea
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn("flex animate-slide-up", msg.role === "user" ? "justify-end" : "justify-start")}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all duration-300 whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.content.split(/(\*\*.*?\*\*)/).map((part, idx) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={idx}>{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={idx}>{part}</span>
                  )
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre productos, precios..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring transition-all duration-200 focus:ring-2 focus:border-primary"
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-xl transition-transform hover:scale-105 active:scale-95">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
