import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "¡Hola! 👋 Soy Sora, Ejecutiva de Grupo PSI. ¿En qué te puedo ayudar hoy?",
  },
];

const WHATSAPP_NUMBER = "5219931684717";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function renderMarkdown(text: string) {
  return text.split(/(\*\*.*?\*\*)/).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.includes("\n")) {
      return (
        <span key={idx}>
          {part.split("\n").map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate typing effect - reveals characters gradually
  const typeMessage = useCallback((fullText: string, messageId: string) => {
    let charIndex = 0;
    const speed = 18 + Math.random() * 12; // 18-30ms per char (human-like)
    
    typingIntervalRef.current = setInterval(() => {
      charIndex += 1 + Math.floor(Math.random() * 2); // 1-2 chars at a time
      if (charIndex >= fullText.length) {
        charIndex = fullText.length;
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, content: fullText.slice(0, charIndex), isTyping: charIndex < fullText.length }
            : m
        )
      );
    }, speed);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = updatedMessages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("sora-chat", {
        body: { messages: historyForApi },
      });

      if (error) throw error;

      const reply = data?.reply || "Disculpa, no pude procesar tu solicitud. ¿Podrías intentar de nuevo?";
      const msgId = (Date.now() + 1).toString();
      
      // Add empty message first, then type it out
      setMessages(prev => [
        ...prev,
        { id: msgId, role: "assistant", content: "", isTyping: true },
      ]);
      setIsLoading(false);
      
      // Start typing effect
      typeMessage(reply, msgId);
    } catch (err) {
      console.error("Sora chat error:", err);
      const msgId = (Date.now() + 1).toString();
      const fallback = "Disculpa, tengo un pequeño inconveniente. ¿Podrías intentar de nuevo? Si es urgente, escríbenos por WhatsApp.";
      setMessages(prev => [
        ...prev,
        { id: msgId, role: "assistant", content: "", isTyping: true },
      ]);
      setIsLoading(false);
      typeMessage(fallback, msgId);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const anyTyping = messages.some(m => m.isTyping);

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
              <div className="text-sm font-bold text-white">Sora · Ejecutiva Grupo PSI</div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce-soft" />
                En línea
              </div>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-green-400 transition-colors mr-1"
              title="Escribir por WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
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
                {renderMarkdown(msg.content)}
                {msg.isTyping && (
                  <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
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

        {/* WhatsApp fallback banner */}
        <div className="border-t border-border/50 bg-muted/30 px-4 py-2 text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ¿Prefieres WhatsApp? Escríbenos →
          </a>
        </div>

        <div className="border-t border-border p-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre productos, precios..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring transition-all duration-200 focus:ring-2 focus:border-primary"
              disabled={isLoading || anyTyping}
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-xl transition-transform hover:scale-105 active:scale-95" disabled={isLoading || anyTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
