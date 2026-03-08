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
      {/* Floating video button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-[72px] w-[72px] rounded-full shadow-2xl transition-all duration-500 overflow-hidden",
          "animate-glow-pulse hover:scale-110",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <video
          src="/videos/sora.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover scale-150"
        />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[370px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl",
          "max-h-[540px] transition-all duration-400",
          open
            ? "animate-scale-in opacity-100"
            : "scale-90 opacity-0 pointer-events-none"
        )}
      >
        {/* Header with video */}
        <div className="relative flex items-center gap-3 overflow-hidden px-4 py-3">
          {/* Video background */}
          <video
            src="/videos/sora-2.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover brightness-50"
          />
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30">
              <video
                src="/videos/sora.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover scale-150"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Asistente Grupo PSI</div>
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

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn(
                "flex animate-slide-up",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all duration-300",
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
