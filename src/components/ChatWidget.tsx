import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "¡Hola! 👋 Soy el asistente de Grupo PSI. ¿En qué puedo ayudarte? Puedo orientarte sobre extintores, uniformes, mantenimiento o entregas.",
  },
];

const AUTO_RESPONSES: Record<string, string> = {
  extintor: "Contamos con extintores PQS ABC desde 1 kg hasta 4.5 kg, todos certificados. ¿Te gustaría agendar una entrega o necesitas mantenimiento?",
  uniforme: "Tenemos playeras tipo polo y cuello redondo en 100% poliéster, disponibles en varias tallas y colores. ¿Quieres ver el catálogo?",
  mantenimiento: "Ofrecemos servicio de mantenimiento y recarga de extintores. Puedes agendar la recolección desde la página del producto seleccionando una fecha.",
  entrega: "Realizamos entregas en la zona metropolitana. En la página del producto puedes seleccionar la fecha de entrega y ubicación en el mapa.",
  precio: "Los precios varían según el producto. Nuestros extintores van desde $434.71 MXN (1 kg) hasta $827.08 MXN (4.5 kg). ¿Necesitas una cotización?",
  hola: "¡Hola! ¿Cómo puedo ayudarte hoy? Pregúntame sobre productos, precios, entregas o mantenimiento.",
};

function getAutoResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(AUTO_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "Gracias por tu mensaje. Un asesor te contactará pronto. Mientras tanto, puedes explorar nuestro catálogo o agendar un servicio directamente desde la ficha del producto.";
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
      const response = getAutoResponse(userMsg.content);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 overflow-hidden",
          "ring-2 ring-primary/30 hover:ring-primary/60",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <img src="/images/foto_chat.png" alt="Chat" className="h-full w-full object-cover" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300",
          "max-h-[520px]",
          open ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-primary px-4 py-3">
          <img src="/images/foto_chat.png" alt="PSI" className="h-10 w-10 rounded-full ring-2 ring-primary-foreground/30" />
          <div className="flex-1">
            <div className="text-sm font-bold text-primary-foreground">Asistente Grupo PSI</div>
            <div className="text-xs text-primary-foreground/70">En línea</div>
          </div>
          <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
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

        {/* Input */}
        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring focus:ring-2"
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
